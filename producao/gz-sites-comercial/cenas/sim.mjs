// Relógio único do filme. worldTime é o tempo físico (s).
// A tela estica esse relógio: rápido no arremesso, cada vez mais lento até o impacto.

export const FPS = 30;
export const NFRAMES = 900;
export const DURATION = NFRAMES / FPS;

export const BALL_R = 0.033;
export const BOWL_LOCAL_Y = 0.181;
export const SURFACE_R = 0.045;

export const RELEASE_SCREEN = 0.4;
export const IMPACT_SCREEN = 11.0;
export const FRACTURE_END = 14.5;
export const STEER_END = 18.7;
export const SCENE3D_END = 19.15;

// world time keys [screenSeconds, worldSeconds] — estritamente crescente
export const WORLD_KEYS = [
  [0.0, 0.0],
  [0.1, 0.1],
  [0.28, 0.26],
  [0.55, 0.292],
  [1.4, 0.318],
  [3.5, 0.345],
  [7.0, 0.368],
  [11.0, 0.385],
  [14.5, 0.5],
  [30.0, 0.5],
];

export const W_RELEASE = 0.26;
export const W_IMPACT = 0.385;

// Arremesso curto, para a frente da câmera. A taça fica no fim desse voo.
export const P0 = { x: 0.0, y: 0.18, z: -0.06 };
export const P_REL = { x: 0.0, y: 0.22, z: 0.0 };
export const V_REL = { x: 0.02, y: 0.72, z: 6.2 };
export const G = 9.81;

export function flightDir() {
  const x = V_REL.x;
  const z = V_REL.z;
  const l = Math.hypot(x, z) || 1;
  return { x: x / l, y: 0, z: z / l };
}

export function controlPoint() {
  return {
    x: P0.x * 0.35 + P_REL.x * 0.65,
    y: Math.min(P0.y, P_REL.y) - 0.03,
    z: P0.z * 0.4 + P_REL.z * 0.6,
  };
}

const pchip = buildPchip(WORLD_KEYS);

export function worldTime(screen) {
  if (screen <= 0) return 0;
  if (screen >= 30) return WORLD_KEYS[WORLD_KEYS.length - 1][1];
  return pchip.y(screen);
}

export function worldRate(screen) {
  const h = 1 / 240;
  return (worldTime(screen + h) - worldTime(screen - h)) / (2 * h);
}

export function holdPosition(world) {
  const u = clamp(world / W_RELEASE, 0, 1);
  const c = controlPoint();
  const omt = 1 - u;
  return {
    x: omt * omt * P0.x + 2 * omt * u * c.x + u * u * P_REL.x,
    y: omt * omt * P0.y + 2 * omt * u * c.y + u * u * P_REL.y,
    z: omt * omt * P0.z + 2 * omt * u * c.z + u * u * P_REL.z,
  };
}

export function holdVelocity(world) {
  const h = 0.002;
  const a = holdPosition(Math.max(0, world - h));
  const b = holdPosition(Math.min(W_RELEASE, world + h));
  const dt = (Math.min(W_RELEASE, world + h) - Math.max(0, world - h)) || h;
  return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt, z: (b.z - a.z) / dt };
}

export function ballistics(world) {
  const dt = world - W_RELEASE;
  return {
    x: P_REL.x + V_REL.x * dt,
    y: P_REL.y + V_REL.y * dt - 0.5 * G * dt * dt,
    z: P_REL.z + V_REL.z * dt,
  };
}

export function ballPosition(screen) {
  const w = worldTime(screen);
  if (w <= W_RELEASE) return holdPosition(w);
  if (w <= W_IMPACT) return ballistics(w);
  const hit = ballistics(W_IMPACT);
  const dt = w - W_IMPACT;
  // continua, perde um pouco de velocidade no contato
  // no relógio de tela o impacto dura segundos; a esfera segue dentro do quadro
  const keep = 0.16;
  const vx = V_REL.x * keep;
  const vy = (V_REL.y - G * (W_IMPACT - W_RELEASE)) * keep - 0.15;
  const vz = V_REL.z * keep;
  return {
    x: hit.x + vx * dt,
    y: hit.y + vy * dt - 0.5 * G * dt * dt,
    z: hit.z + vz * dt,
  };
}

export function ballImpact() {
  return ballistics(W_IMPACT);
}

// A taça fica à frente da esfera, no plano horizontal do voo.
// O lado -X local da taça aponta de volta para a mão.
export function glassPlacement() {
  const hit = ballImpact();
  const dir = flightDir();
  const bowlY = BOWL_LOCAL_Y;
  const surfaceR = SURFACE_R;
  const worldContact = {
    x: hit.x + dir.x * BALL_R,
    y: hit.y,
    z: hit.z + dir.z * BALL_R,
  };
  return {
    position: {
      x: worldContact.x + dir.x * (surfaceR - 0.01),
      y: worldContact.y - bowlY,
      z: worldContact.z + dir.z * (surfaceR - 0.01),
    },
    worldContact,
    dir,
    bowlLocal: { x: 0, y: bowlY, z: 0 },
    contactLocal: { x: -surfaceR, y: bowlY, z: 0 },
    surfaceR,
  };
}

export function gap(screen) {
  const b = ballPosition(screen);
  const g = glassPlacement();
  const c = g.worldContact;
  const d = g.dir;
  const sx = b.x + d.x * BALL_R;
  const sy = b.y;
  const sz = b.z + d.z * BALL_R;
  return Math.hypot(c.x - sx, c.y - sy, c.z - sz);
}

export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

function buildPchip(keys) {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const h = [];
  const d = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  const m = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  // Fritsch-Carlson limiter
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
  }
  return {
    y(x) {
      let i = 0;
      while (i < n - 2 && x > xs[i + 1]) i++;
      const t = (x - xs[i]) / h[i];
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      return h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1];
    },
  };
}
