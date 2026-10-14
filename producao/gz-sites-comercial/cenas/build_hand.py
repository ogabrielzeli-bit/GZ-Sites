#!/usr/bin/env python3
"""Mão fechada em superfície lisa (surface nets) para o arremesso.

A malha nasce no espaço local da esfera: origem no centro da bola,
+X é a direção do lançamento, +Z aponta para a câmera.
O corte do antebraço fica fora do quadro no plano fechado.
"""
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent / "hand.obj"


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1.0 - h) + a * h - k * h * (1.0 - h)


def sd_capsule(P, a, b, r):
    pa = P - a
    ba = b - a
    denom = float(np.dot(ba, ba))
    h = np.clip(np.sum(pa * ba, axis=-1) / denom, 0.0, 1.0)
    return np.linalg.norm(pa - ba * h[..., None], axis=-1) - r


def sd_ellipsoid(P, c, r):
    q = (P - c) / r
    k = np.linalg.norm(q, axis=-1)
    return (k - 1.0) * float(np.min(r))


def field_at(P):
    # antebraço — entra pela esquerda do quadro
    d = sd_capsule(P, np.array([-0.58, -0.01, 0.0]), np.array([-0.11, -0.004, 0.002]), 0.036)
    d = smin(d, sd_capsule(P, np.array([-0.13, -0.004, 0.0]), np.array([-0.055, -0.002, 0.0]), 0.028), 0.012)
    # punho
    d = smin(d, sd_ellipsoid(P, np.array([-0.048, -0.004, 0.0]), np.array([0.026, 0.020, 0.024])), 0.014)
    # palma, atrás da esfera (raio 0.033)
    d = smin(d, sd_ellipsoid(P, np.array([-0.040, -0.006, -0.002]), np.array([0.024, 0.018, 0.026])), 0.012)
    # eminência tenar (polegar)
    d = smin(d, sd_ellipsoid(P, np.array([-0.030, -0.012, 0.020]), np.array([0.020, 0.014, 0.016])), 0.010)
    # hipotenar
    d = smin(d, sd_ellipsoid(P, np.array([-0.034, -0.008, -0.018]), np.array([0.016, 0.012, 0.012])), 0.008)

    fingers = [
        # indicador, médio, anelar, mínimo — sobre o topo, ponta na frente
        ([(-0.020, 0.020, -0.014), (-0.004, 0.038, -0.015), (0.020, 0.034, -0.013), (0.034, 0.010, -0.010), (0.030, -0.008, -0.008)], 0.0074),
        ([(-0.016, 0.024, -0.003), (0.002, 0.042, -0.003), (0.024, 0.036, -0.002), (0.038, 0.012, 0.000), (0.032, -0.010, 0.001)], 0.0078),
        ([(-0.018, 0.022, 0.008), (0.000, 0.039, 0.009), (0.022, 0.032, 0.010), (0.034, 0.008, 0.010), (0.028, -0.010, 0.008)], 0.0072),
        ([(-0.022, 0.016, 0.017), (-0.006, 0.030, 0.018), (0.012, 0.026, 0.017), (0.024, 0.006, 0.015), (0.020, -0.008, 0.013)], 0.0062),
    ]
    for pts, rad in fingers:
        for i in range(len(pts) - 1):
            a = np.array(pts[i], dtype=np.float64)
            b = np.array(pts[i + 1], dtype=np.float64)
            rr = rad * (1.0 - 0.12 * i)
            d = smin(d, sd_capsule(P, a, b, rr), 0.0065)
        # nó dos dedos
        k = np.array(pts[0], dtype=np.float64)
        d = smin(d, np.linalg.norm(P - k, axis=-1) - rad * 1.15, 0.006)

    thumb = [
        (-0.028, -0.010, 0.022),
        (-0.006, -0.024, 0.030),
        (0.016, -0.022, 0.024),
        (0.030, -0.008, 0.012),
    ]
    for i in range(len(thumb) - 1):
        a = np.array(thumb[i], dtype=np.float64)
        b = np.array(thumb[i + 1], dtype=np.float64)
        d = smin(d, sd_capsule(P, a, b, 0.0076 * (1.0 - 0.10 * i)), 0.007)

    # corte plano fora do quadro — sem tampa visível
    d = np.maximum(d, -0.56 - P[..., 0])
    return d


def surface_nets(step=0.00135):
    xs = np.arange(-0.58, 0.048, step)
    ys = np.arange(-0.055, 0.055, step)
    zs = np.arange(-0.046, 0.046, step)
    nx, ny, nz = len(xs), len(ys), len(zs)
    print("grid", nx, ny, nz, "vox", nx * ny * nz)
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing="ij")
    P = np.stack([X, Y, Z], axis=-1)
    F = field_at(P).astype(np.float32)
    print("field", float(F.min()), float(F.max()))

    c000 = F[:-1, :-1, :-1]
    c100 = F[1:, :-1, :-1]
    c010 = F[:-1, 1:, :-1]
    c110 = F[1:, 1:, :-1]
    c001 = F[:-1, :-1, 1:]
    c101 = F[1:, :-1, 1:]
    c011 = F[:-1, 1:, 1:]
    c111 = F[1:, 1:, 1:]
    inside = (
        (c000 < 0).astype(np.uint8)
        + (c100 < 0).astype(np.uint8)
        + (c010 < 0).astype(np.uint8)
        + (c110 < 0).astype(np.uint8)
        + (c001 < 0).astype(np.uint8)
        + (c101 < 0).astype(np.uint8)
        + (c011 < 0).astype(np.uint8)
        + (c111 < 0).astype(np.uint8)
    )
    mixed = np.argwhere((inside > 0) & (inside < 8))
    print("mixed cells", len(mixed))

    corners = np.array(
        [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
        dtype=np.int32,
    )
    edges = [(0, 1), (1, 2), (2, 3), (3, 0), (4, 5), (5, 6), (6, 7), (7, 4), (0, 4), (1, 5), (2, 6), (3, 7)]

    vert_of = {}
    verts = []
    for i, j, k in mixed:
        vals = []
        pts = []
        for ox, oy, oz in corners:
            vals.append(F[i + int(ox), j + int(oy), k + int(oz)])
        base = np.array([xs[i], ys[j], zs[k]], dtype=np.float64)
        for ia, ib in edges:
            va, vb = vals[ia], vals[ib]
            if va * vb >= 0:
                continue
            t = float(va) / (float(va) - float(vb) + 1e-12)
            pa = base + corners[ia] * step
            pb = base + corners[ib] * step
            pts.append(pa + (pb - pa) * t)
        if len(pts) < 3:
            continue
        vert_of[(int(i), int(j), int(k))] = len(verts)
        verts.append(np.mean(pts, axis=0))
    verts = np.array(verts, dtype=np.float64)
    print("verts", len(verts))

    def add_quads(axis):
        faces = []
        # edges along axis where the field changes
        if axis == 0:
            a = F[:-1, :, :]
            b = F[1:, :, :]
            sign = (a < 0) != (b < 0)
            ii, jj, kk = np.where(sign)
            for i, j, k in zip(ii, jj, kk):
                cells = [(i, j, k), (i, j - 1, k), (i, j, k - 1), (i, j - 1, k - 1)]
                grad = np.array([float(b[i, j, k] - a[i, j, k]), 0.0, 0.0])
                faces.append((cells, grad))
        elif axis == 1:
            a = F[:, :-1, :]
            b = F[:, 1:, :]
            sign = (a < 0) != (b < 0)
            ii, jj, kk = np.where(sign)
            for i, j, k in zip(ii, jj, kk):
                cells = [(i, j, k), (i, j, k - 1), (i - 1, j, k), (i - 1, j, k - 1)]
                grad = np.array([0.0, float(b[i, j, k] - a[i, j, k]), 0.0])
                faces.append((cells, grad))
        else:
            a = F[:, :, :-1]
            b = F[:, :, 1:]
            sign = (a < 0) != (b < 0)
            ii, jj, kk = np.where(sign)
            for i, j, k in zip(ii, jj, kk):
                cells = [(i, j, k), (i - 1, j, k), (i, j - 1, k), (i - 1, j - 1, k)]
                grad = np.array([0.0, 0.0, float(b[i, j, k] - a[i, j, k])])
                faces.append((cells, grad))
        tris = []
        for cells, grad in faces:
            ids = []
            ok = True
            for c in cells:
                key = (int(c[0]), int(c[1]), int(c[2]))
                if key not in vert_of:
                    ok = False
                    break
                ids.append(vert_of[key])
            if not ok or len(set(ids)) < 4:
                continue
            pts = np.stack([verts[i] for i in ids], axis=0)
            center = pts.mean(axis=0)
            rel = pts - center
            axis = int(np.argmax(np.abs(grad)))
            if axis == 0:
                ang = np.arctan2(rel[:, 2], rel[:, 1])
            elif axis == 1:
                ang = np.arctan2(rel[:, 0], rel[:, 2])
            else:
                ang = np.arctan2(rel[:, 1], rel[:, 0])
            order = np.argsort(ang)
            ids = [ids[int(i)] for i in order]
            v0, v1, v2 = verts[ids[0]], verts[ids[1]], verts[ids[2]]
            n = np.cross(v1 - v0, v2 - v0)
            if np.dot(n, grad) < 0:
                ids = [ids[0], ids[3], ids[2], ids[1]]
            tris.append((ids[0], ids[1], ids[2]))
            tris.append((ids[0], ids[2], ids[3]))
        return tris

    # The cell that owns a crossing on its min edges is (i,j,k) for an edge
    # starting at grid point (i,j,k). Cells sharing an X-edge at (i,j,k) are
    # the four cells whose corner set includes both (i,j,k) and (i+1,j,k):
    # (i, j, k), (i, j-1, k), (i, j, k-1), (i, j-1, k-1)
    # BUT only cells that exist in vert_of (mixed). Edges on the boundary
    # of the volume miss neighbors — skipped. Good.

    tris = []
    # Fix cell indexing: vert_of is keyed by the cell's min corner, which is
    # the same index space as the lower point of a grid edge only when the
    # cell starts at that point. add_quads uses grid point indices from
    # np.where on F[:-1], which matches cell indices. Cells at -1 are absent.
    tris += add_quads(0)
    tris += add_quads(1)
    tris += add_quads(2)
    print("tris", len(tris))

    # laplacian leve
    adj = [[] for _ in range(len(verts))]
    for a, b, c in tris:
        adj[a] += [b, c]
        adj[b] += [a, c]
        adj[c] += [a, b]
    acc = verts.copy()
    for _ in range(2):
        nxt = acc.copy()
        for i, nb in enumerate(adj):
            if not nb:
                continue
            nxt[i] = acc[i] * 0.72 + np.mean(acc[list(set(nb))], axis=0) * 0.28
        acc = nxt
    verts = acc

    # normais
    normals = np.zeros_like(verts)
    for a, b, c in tris:
        n = np.cross(verts[b] - verts[a], verts[c] - verts[a])
        normals[a] += n
        normals[b] += n
        normals[c] += n
    ln = np.linalg.norm(normals, axis=1, keepdims=True)
    ln[ln < 1e-12] = 1
    normals /= ln

    # descarta degenerados
    clean = []
    for a, b, c in tris:
        area = np.linalg.norm(np.cross(verts[b] - verts[a], verts[c] - verts[a]))
        if area > 1e-10 and len({a, b, c}) == 3:
            clean.append((a, b, c))
    print("clean tris", len(clean))
    return verts, normals, clean


def main():
    verts, normals, tris = surface_nets()
    with OUT.open("w") as f:
        f.write("# mao GZ — gerada, nao copiar de um modelo de terceiros\n")
        for v in verts:
            f.write(f"v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
        for n in normals:
            f.write(f"vn {n[0]:.5f} {n[1]:.5f} {n[2]:.5f}\n")
        for a, b, c in tris:
            f.write(f"f {a+1}//{a+1} {b+1}//{b+1} {c+1}//{c+1}\n")
    print("wrote", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
