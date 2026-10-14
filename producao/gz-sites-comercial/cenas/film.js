import * as THREE from "three";
import {
  BALL_R,
  BOWL_LOCAL_Y,
  SURFACE_R,
  FPS,
  W_RELEASE,
  W_IMPACT,
  P_REL,
  V_REL,
  G,
  worldTime,
  worldRate,
  ballPosition,
  ballImpact,
  glassPlacement,
  holdPosition,
  holdVelocity,
  smoothstep,
  lerp,
  clamp,
} from "./sim.mjs";

const params = new URLSearchParams(location.search);
const W = Number(params.get("w") || 1080);
const H = Number(params.get("h") || 1920);

const glCanvas = document.getElementById("c");
const outCanvas = document.getElementById("out");
glCanvas.width = outCanvas.width = W;
glCanvas.height = outCanvas.height = H;
const ctx2 = outCanvas.getContext("2d", { alpha: false });

const renderer = new THREE.WebGLRenderer({
  canvas: glCanvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x100f0d, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x100f0d);
const camera = new THREE.PerspectiveCamera(36, W / H, 0.02, 40);

function smoothRect(dir, axis, hx, hy) {
  const d = dir.clone().normalize();
  const dot = clamp(d.dot(axis), -1, 1);
  if (dot < 0.12) return 0;
  const up = Math.abs(axis.y) > 0.85 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const tx = new THREE.Vector3().crossVectors(up, axis).normalize();
  const ty = new THREE.Vector3().crossVectors(axis, tx).normalize();
  const e = Math.hypot(d.dot(tx) / hx, d.dot(ty) / hy);
  const s = clamp((dot - 0.12) / 0.7, 0, 1);
  return Math.exp(-e * e * 2.6) * (s * s * (3 - 2 * s));
}

function makeEnv() {
  const w = 768;
  const h = 384;
  const data = new Float32Array(w * h * 4);
  const keyAxis = new THREE.Vector3(-0.45, 0.78, 0.42).normalize();
  const rimAxis = new THREE.Vector3(0.72, 0.28, -0.62).normalize();
  const warmAxis = new THREE.Vector3(-0.85, 0.05, 0.35).normalize();
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - y / (h - 1)) * Math.PI;
    for (let x = 0; x < w; x++) {
      const lon = (x / (w - 1) - 0.5) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
      let r = 0.05;
      let g = 0.047;
      let b = 0.042;
      const hz = Math.exp(-dir.y * dir.y * 6);
      r += hz * 0.16;
      g += hz * 0.15;
      b += hz * 0.13;
      const key = smoothRect(dir, keyAxis, 0.2, 0.58);
      r += key * 7.2;
      g += key * 6.9;
      b += key * 6.3;
      const rim = smoothRect(dir, rimAxis, 0.1, 0.7);
      r += rim * 3.4;
      g += rim * 3.7;
      b += rim * 4.4;
      const face = smoothRect(dir, new THREE.Vector3(0.02, 0.2, 0.98).normalize(), 0.38, 0.28);
      r += face * 1.6;
      g += face * 1.55;
      b += face * 1.45;
      const warm = smoothRect(dir, warmAxis, 0.22, 0.18);
      r += warm * 0.7;
      g += warm * 0.38;
      b += warm * 0.14;
      if (dir.y < 0) {
        const f = Math.min(1, -dir.y);
        r += f * 0.035;
        g += f * 0.032;
        b += f * 0.028;
      }
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 1;
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

scene.environment = makeEnv();

const chromeMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 1,
  roughness: 0.065,
  envMapIntensity: 1.28,
  clearcoat: 0.18,
  clearcoatRoughness: 0.18,
});
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.015,
  transmission: 1,
  thickness: 0.0035,
  side: THREE.DoubleSide,
  ior: 1.52,
  attenuationColor: new THREE.Color(0xf4f7f6),
  attenuationDistance: 2.4,
  envMapIntensity: 1.65,
  clearcoat: 1,
  clearcoatRoughness: 0.035,
  specularIntensity: 1,
});
const skinMat = new THREE.MeshPhysicalMaterial({
  color: 0xb07864,
  roughness: 0.58,
  metalness: 0,
  sheen: 0.22,
  sheenColor: new THREE.Color(0xe0b2a2),
  sheenRoughness: 0.62,
  envMapIntensity: 0.32,
  side: THREE.DoubleSide,
});
const lineMat = new THREE.MeshPhysicalMaterial({
  color: 0xf2f2f0,
  metalness: 0.85,
  roughness: 0.18,
  envMapIntensity: 1,
});

function bowlProfile(t) {
  const rim = 0.046;
  const neck = 0.009;
  const s = Math.sin((t * Math.PI) / 2);
  const r = neck + (rim - neck) * Math.pow(s, 0.62);
  const y = 0.128 + t * 0.062;
  return { r, y };
}

function buildIntactBowl() {
  const pts = [];
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const p = bowlProfile(i / n);
    pts.push(new THREE.Vector2(Math.max(0.001, p.r), p.y));
  }
  for (let i = n; i >= 0; i--) {
    const p = bowlProfile(i / n);
    pts.push(new THREE.Vector2(Math.max(0.0012, p.r - 0.0026), p.y));
  }
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 72), glassMat);
  mesh.name = "bowl";
  return mesh;
}

const glassAnchor = glassPlacement();
const glassRig = new THREE.Group();
glassRig.position.set(glassAnchor.position.x, glassAnchor.position.y, glassAnchor.position.z);
glassRig.quaternion.setFromUnitVectors(
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(-glassAnchor.dir.x, 0, -glassAnchor.dir.z)
);
scene.add(glassRig);

const intactBowl = buildIntactBowl();
glassRig.add(intactBowl);
const stemMat = glassMat;
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0033, 0.0036, 0.112, 20), stemMat);
stem.position.y = 0.072;
glassRig.add(stem);
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, 0.006, 40), stemMat);
base.position.y = 0.012;
glassRig.add(base);

const plinthH = Math.max(0.02, glassRig.position.y + 0.014);
const plinth = new THREE.Mesh(
  new THREE.CylinderGeometry(0.072, 0.08, plinthH, 40),
  new THREE.MeshPhysicalMaterial({ color: 0x1c1a17, roughness: 0.42, metalness: 0.18, envMapIntensity: 0.5 })
);
plinth.position.set(glassRig.position.x, plinthH / 2, glassRig.position.z);
scene.add(plinth);

const table = new THREE.Mesh(
  new THREE.BoxGeometry(40, 0.08, 40),
  new THREE.MeshPhysicalMaterial({ color: 0x1a1816, roughness: 1, metalness: 0, envMapIntensity: 0.2 })
);
table.position.set(0, -0.04, 0);
scene.add(table);

const cyc = new THREE.Mesh(
  new THREE.SphereGeometry(30, 160, 100),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      A: { value: new THREE.Color(0x161411) },
      B: { value: new THREE.Color(0x4a433b) },
      C: { value: new THREE.Color(0x2a261f) },
    },
    vertexShader: "varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "varying vec3 vP; uniform vec3 A,B,C; void main(){ float h=normalize(vP).y; vec3 col=mix(C,B,smoothstep(-0.35,0.05,h)); col=mix(col,A,smoothstep(0.0,0.75,h)); float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453); col+=(n-0.5)*0.003; gl_FragColor=vec4(col,1.0); }",
  })
);
scene.add(cyc);

function addSoftbox(pos, size, color, intensity) {
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(size.x + 0.06, size.y + 0.06, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.8 })
  );
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x, size.y),
    new THREE.MeshBasicMaterial({ color })
  );
  panel.position.z = 0.03;
  const g = new THREE.Group();
  g.add(frame);
  g.add(panel);
  g.position.copy(pos);
  g.lookAt(0.4, 0.35, 0);
  g.visible = false;
  scene.add(g);
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.copy(pos);
  scene.add(light);
  return g;
}
addSoftbox(new THREE.Vector3(-1.3, 2.15, 1.35), { x: 1.35, y: 0.85 }, 0xfff4e6, 2.5);
addSoftbox(new THREE.Vector3(2.4, 1.15, -1.5), { x: 0.28, y: 1.3 }, 0xd5e4ff, 1.35);
scene.add(new THREE.AmbientLight(0xfff5ee, 0.07));
const kickL = new THREE.DirectionalLight(0xfff8f0, 2.4);
kickL.position.set(-2.6, 0.55, 1.4);
scene.add(kickL);
const kickR = new THREE.DirectionalLight(0xe7f1ff, 2.1);
kickR.position.set(2.8, 0.45, 1.1);
scene.add(kickR);

function weldSmooth(flat) {
  const map = new Map();
  const vs = [];
  const index = [];
  for (let i = 0; i < flat.length; i += 3) {
    const x = flat[i];
    const y = flat[i + 1];
    const z = flat[i + 2];
    const k = `${Math.round(x * 8000)}_${Math.round(y * 8000)}_${Math.round(z * 8000)}`;
    let id = map.get(k);
    if (id === undefined) {
      id = vs.length / 3;
      map.set(k, id);
      vs.push(x, y, z);
    }
    index.push(id);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3));
  geo.setIndex(index);
  return geo;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildShards() {
  const tSeg = 40;
  const phiSeg = 140;
  const gores = 10;
  const bands = 2;
  const rand = rng(7);
  const shards = [];
  const hit = new THREE.Vector3(-SURFACE_R, BOWL_LOCAL_Y, 0);
  for (let g = 0; g < gores; g++) {
    for (let b = 0; b < bands; b++) {
      const i0 = Math.round((b * tSeg) / bands);
      const i1 = Math.round(((b + 1) * tSeg) / bands);
      const j0 = Math.round((g * phiSeg) / gores);
      const j1 = Math.round(((g + 1) * phiSeg) / gores);
      const pos = [];
      const push = (a, b2, c) => pos.push(a[0], a[1], a[2], b2[0], b2[1], b2[2], c[0], c[1], c[2]);
      const pt = (i, j, inner) => {
        const p = bowlProfile(i / tSeg);
        const r = inner ? Math.max(0.0014, p.r - 0.0026) : p.r;
        const a = (j / phiSeg) * Math.PI * 2;
        return [r * Math.cos(a), p.y, r * Math.sin(a)];
      };
      for (let i = i0; i < i1; i++) {
        for (let j = j0; j < j1; j++) {
          const o00 = pt(i, j, false);
          const o10 = pt(i + 1, j, false);
          const o11 = pt(i + 1, j + 1, false);
          const o01 = pt(i, j + 1, false);
          push(o00, o11, o10);
          push(o00, o01, o11);
          const i00 = pt(i, j, true);
          const i10 = pt(i + 1, j, true);
          const i11 = pt(i + 1, j + 1, true);
          const i01 = pt(i, j + 1, true);
          push(i00, i10, i11);
          push(i00, i11, i01);
        }
      }
      const wall = (aa, bb, cc, dd) => {
        push(aa, bb, cc);
        push(aa, cc, dd);
      };
      for (let i = i0; i < i1; i++) {
        wall(pt(i, j0, false), pt(i + 1, j0, false), pt(i + 1, j0, true), pt(i, j0, true));
        wall(pt(i, j1, true), pt(i + 1, j1, true), pt(i + 1, j1, false), pt(i, j1, false));
      }
      for (let j = j0; j < j1; j++) {
        wall(pt(i0, j, true), pt(i0, j + 1, true), pt(i0, j + 1, false), pt(i0, j, false));
        wall(pt(i1, j, false), pt(i1, j + 1, false), pt(i1, j + 1, true), pt(i1, j, true));
      }
      const geo = weldSmooth(pos);
      geo.computeVertexNormals();
      const c = new THREE.Vector3();
      geo.computeBoundingBox();
      geo.boundingBox.getCenter(c);
      geo.translate(-c.x, -c.y, -c.z);
      const mesh = new THREE.Mesh(geo, glassMat);
      const radial = c.clone().sub(hit);
      if (radial.length() < 1e-4) radial.set(0, 1, 0);
      radial.normalize();
      const tangent = new THREE.Vector3(-radial.z, 0.2 * (rand() - 0.5), radial.x).normalize();
      const hitDist = c.distanceTo(hit);
      const vel = radial
        .multiplyScalar(0.35 + rand() * 0.3)
        .add(new THREE.Vector3(0.55, 0.22 + rand() * 0.35, (rand() - 0.5) * 0.45));
      const spin = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(8 + rand() * 14);
      mesh.userData = { center: c.clone(), vel, spin, seed: rand(), hitDist };
      mesh.visible = false;
      glassRig.add(mesh);
      shards.push(mesh);
    }
  }
  shards.sort((a, b) => b.userData.center.length() - a.userData.center.length());
  return shards;
}

const shards = buildShards();

const page = {
  x: glassRig.position.x,
  y: glassRig.position.y + 0.55,
  z: glassRig.position.z - 0.05,
  h: 1.46,
};
page.w = page.h * (9 / 16);

function pagePoint(nx, ny, zOff = 0) {
  return new THREE.Vector3(
    page.x + (nx - 0.5) * page.w,
    page.y + (0.5 - ny) * page.h,
    page.z + zOff
  );
}

const layoutEdges = [
  [0.08, 0.078, 0.92, 0.078],
  [0.08, 0.15, 0.92, 0.15],
  [0.92, 0.15, 0.92, 0.4],
  [0.92, 0.4, 0.08, 0.4],
  [0.08, 0.4, 0.08, 0.15],
  [0.08, 0.45, 0.92, 0.45],
  [0.92, 0.45, 0.92, 0.64],
  [0.92, 0.64, 0.08, 0.64],
  [0.08, 0.64, 0.08, 0.45],
  [0.08, 0.71, 0.92, 0.71],
  [0.08, 0.79, 0.92, 0.79],
  [0.08, 0.87, 0.92, 0.87],
];

const rules = [];
layoutEdges.forEach((e, idx) => {
  const a = pagePoint(e[0], e[1]);
  const b = pagePoint(e[2], e[3]);
  const len = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.0045, 0.0045), lineMat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.lookAt(b);
  mesh.rotateY(Math.PI / 2);
  mesh.scale.set(0.001, 1, 1);
  mesh.userData.len = len;
  mesh.userData.delay = idx * 0.035;
  scene.add(mesh);
  rules.push(mesh);
});

glassRig.updateMatrixWorld(true);
shards.forEach((mesh, i) => {
  const edge = layoutEdges[i % layoutEdges.length];
  const t = i < layoutEdges.length ? 0.32 : 0.68;
  const nx = edge[0] + (edge[2] - edge[0]) * t;
  const ny = edge[1] + (edge[3] - edge[1]) * t;
  mesh.userData.target = glassRig.worldToLocal(pagePoint(nx, ny, 0.01 + (i % 3) * 0.004));
  const dx = edge[2] - edge[0];
  const dy = edge[3] - edge[1];
  const q = new THREE.Quaternion();
  const dir = new THREE.Vector3(dx, -dy, 0).normalize();
  if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
  q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
  mesh.userData.targetQ = q;
});

function buildCracks() {
  const group = new THREE.Group();
  const origin = new THREE.Vector3(-SURFACE_R, BOWL_LOCAL_Y, 0);
  const rand = rng(3);
  for (let k = 0; k < 9; k++) {
    const pts = [origin.clone()];
    let t = 0.62;
    let phi = Math.PI + (rand() - 0.5) * 0.4;
    const tEnd = 0.08 + rand() * 0.9;
    const phiEnd = phi + (rand() - 0.5) * 2.4;
    const steps = 7;
    for (let s = 1; s <= steps; s++) {
      const u = s / steps;
      t = lerp(0.62, tEnd, u) + Math.sin(u * 6 + k) * 0.02;
      phi = lerp(Math.PI, phiEnd, u);
      t = clamp(t, 0.02, 0.98);
      const p = bowlProfile(t);
      pts.push(new THREE.Vector3(p.r * Math.cos(phi), p.y, p.r * Math.sin(phi)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, 0.00115, 5, false),
      new THREE.MeshBasicMaterial({ color: 0xf7fbff, transparent: true, opacity: 0.0, depthWrite: false })
    );
    tube.userData.mat = tube.material;
    group.add(tube);
  }
  group.visible = false;
  glassRig.add(group);
  return group;
}
const cracks = buildCracks();

const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 80, 56), chromeMat);
scene.add(ball);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.05, 24),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.004;
scene.add(shadow);

const hand = new THREE.Group();
scene.add(hand);

function parseOBJ(text) {
  const vs = [];
  const ns = [];
  const index = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("v ")) {
      const p = line.trim().split(/\s+/);
      vs.push(Number(p[1]), Number(p[2]), Number(p[3]));
    } else if (line.startsWith("vn ")) {
      const p = line.trim().split(/\s+/);
      ns.push(Number(p[1]), Number(p[2]), Number(p[3]));
    } else if (line.startsWith("f ")) {
      const p = line.trim().split(/\s+/);
      for (let i = 1; i <= 3; i++) {
        const parts = p[i].split("/");
        index.push(Number(parts[0]) - 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(ns, 3));
  geo.setIndex(index);
  return geo;
}

const dustGeo = new THREE.BufferGeometry();
const dustN = 36;
const dustPos = new Float32Array(dustN * 3);
const randD = rng(11);
for (let i = 0; i < dustN; i++) {
  dustPos[i * 3] = -1.9 + randD() * 4.0;
  dustPos[i * 3 + 1] = 0.08 + randD() * 0.55;
  dustPos[i * 3 + 2] = -0.25 + randD() * 0.6;
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dustSprite = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, "rgba(255,255,255,0.85)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  return tex;
})();
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({
    size: 0.005,
    map: dustSprite,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
);
scene.add(dust);

let snapPose = null;

function poseHand(screen) {
  const w = worldTime(screen);
  let pos;
  let vel;
  if (w <= W_RELEASE) {
    pos = { ...holdPosition(w) };
    vel = holdVelocity(w);
  } else {
    const dt = w - W_RELEASE;
    const travel = 0.045 * (1 - Math.exp(-dt * 12));
    const dir = new THREE.Vector3(V_REL.x, V_REL.y, V_REL.z).normalize();
    pos = {
      x: P_REL.x + dir.x * travel,
      y: P_REL.y + dir.y * travel,
      z: P_REL.z + dir.z * travel,
    };
    vel = V_REL;
  }
  if (screen > 0.42) {
    const s = screen - 0.42;
    pos.y -= s * s * 2.6;
    pos.x -= s * 0.04;
  }
  const dir = new THREE.Vector3(vel.x, vel.y, vel.z);
  if (dir.length() < 1e-4) dir.set(1, 0, 0);
  dir.normalize();
  const yHint = new THREE.Vector3(0, 1, 0);
  if (Math.abs(dir.dot(yHint)) > 0.92) yHint.set(0, 0, 1);
  const zAxis = new THREE.Vector3().crossVectors(dir, yHint).normalize();
  const yAxis = new THREE.Vector3().crossVectors(zAxis, dir).normalize();
  hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(dir, yAxis, zAxis));
  hand.position.set(pos.x, pos.y, pos.z);
  hand.visible = screen < 0.2;
}

function placeShard(mesh, screen) {
  const w = worldTime(screen);
  const dt = Math.max(0, w - W_IMPACT);
  const rest = mesh.userData.center;
  const vel = mesh.userData.vel.clone();
  const spd = vel.length() || 1;
  vel.multiplyScalar(1 / spd);
  const near = clamp(1 - (mesh.userData.hitDist || 0) / 0.055, 0, 1);
  const burst = 1 - Math.exp(-dt * 60);
  const travel = burst * (0.006 + near * 0.032 + mesh.userData.seed * 0.014) + dt * (0.18 + near * 0.4);
  const phys = rest.clone().add(vel.multiplyScalar(travel + 0.0004));
  phys.y -= 0.5 * G * dt * dt * 0.1;
  const spin = mesh.userData.spin;
  const spinT = burst * 0.55 + dt * 4;
  mesh.position.copy(phys);
  mesh.quaternion.setFromEuler(new THREE.Euler(spin.x * spinT, spin.y * spinT, spin.z * spinT));
}

function poseBall(screen) {
  const p = ballPosition(screen);
  ball.position.set(p.x, p.y, p.z);
  const w = worldTime(screen);
  ball.rotation.set(w * 5.5, w * 3.2, w * 24);
  shadow.position.x = p.x;
  shadow.position.z = p.z;
  const h = Math.max(0.04, p.y);
  const sc = 0.7 + h * 0.8;
  shadow.scale.set(sc, sc, sc);
  shadow.material.opacity = clamp(0.34 - h * 0.25, 0.08, 0.32);
}

function poseShards(screen) {
  const w = worldTime(screen);
  const show = screen >= 11.38;
  intactBowl.visible = !show;
  cracks.visible = screen >= 10.96 && screen < 11.62;
  const crackU = smoothstep(11.0, 11.42, screen);
  cracks.children.forEach((tube, i) => {
    const local = clamp((crackU * 1.15 - i * 0.035) / 0.85, 0, 1);
    tube.material.opacity = local * 0.9;
    tube.scale.setScalar(0.15 + local * 0.85);
  });
  if (screen >= 14.5 && !snapPose) {
    shards.forEach((mesh) => placeShard(mesh, 14.5));
    snapPose = shards.map((m) => ({
      p: m.position.clone(),
      q: m.quaternion.clone(),
    }));
  }
  shards.forEach((mesh, i) => {
    mesh.visible = show;
    if (!show) return;
    if (screen < 14.5) {
      placeShard(mesh, screen);
    } else {
      const u = smoothstep(14.5, 18.35, screen);
      const e = u * u * (3 - 2 * u);
      const from = snapPose[i].p;
      const target = mesh.userData.target.clone();
      const yLift = Math.sin(Math.PI * e) * (0.08 + (i % 5) * 0.02);
      mesh.position.lerpVectors(from, target, e);
      mesh.position.y += yLift * (1 - e);
      mesh.quaternion.copy(snapPose[i].q).slerp(mesh.userData.targetQ, e);
    }
  });
  if (screen >= 12.1 && screen < 14.6) {
    const dt = Math.max(0, w - W_IMPACT);
    base.rotation.z = dt * 0.35;
    base.position.x += 0;
    base.position.x = dt * 0.03;
  }
  const lineU = smoothstep(16.2, 18.5, screen);
  rules.forEach((mesh) => {
    const u = clamp((lineU - mesh.userData.delay) / 0.55, 0, 1);
    const e = u * u * (3 - 2 * u);
    mesh.scale.x = Math.max(0.001, mesh.userData.len * e);
    mesh.visible = e > 0.01;
  });
}

function mix3(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function horizontalHalfTan(fov) {
  return Math.tan((fov * Math.PI) / 360) * (W / H);
}

function poseCamera(screen) {
  const b = ball.position.clone();
  const place = glassPlacement();
  const g = new THREE.Vector3(place.worldContact.x, place.worldContact.y, place.worldContact.z);
  const v = new THREE.Vector3(place.dir.x, 0, place.dir.z).normalize();
  const side = new THREE.Vector3(-v.z, 0, v.x);
  const graphic = smoothstep(15.4, 17.2, screen);
  table.visible = graphic < 0.9;
  plinth.visible = graphic < 0.9;
  cyc.visible = true;
  if (screen >= 16.8) {
    base.visible = false;
    stem.visible = false;
  }
  camera.up.set(0, 1, 0);

  if (screen >= 14.5) {
    const u = smoothstep(14.5, 17.6, screen);
    const fromP = g.clone().addScaledVector(v, -0.48).addScaledVector(side, 0.05);
    fromP.y = g.y + 0.02;
    const fromL = g.clone();
    const endFov = 47.2;
    const d = (page.h * 1.04) / (2 * Math.tan((endFov * Math.PI) / 360));
    const toP = new THREE.Vector3(page.x, page.y, page.z + d);
    const toL = new THREE.Vector3(page.x, page.y, page.z);
    camera.position.lerpVectors(fromP, toP, u);
    const look = fromL.lerp(toL, u);
    camera.fov = lerp(30, endFov, u);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    return;
  }

  if (screen < 1.25) {
    const rel = holdPosition(W_RELEASE);
    const cam = new THREE.Vector3(rel.x, rel.y - 0.18, rel.z);
    cam.addScaledVector(v, -0.82);
    cam.addScaledVector(side, 0.14);
    const look = new THREE.Vector3(rel.x, rel.y + 0.05, rel.z).addScaledVector(v, 0.5);
    camera.fov = 46;
    camera.position.copy(cam);
    camera.lookAt(look);
  } else if (screen < 11.05) {
    const u = smoothstep(1.25, 10.6, screen);
    const along = b.clone().lerp(g, 0.42);
    const dist = lerp(0.72, 0.32, u);
    const cam = along.clone().addScaledVector(v, -dist).addScaledVector(side, lerp(0.14, 0.04, u));
    cam.y = lerp(along.y - 0.04, g.y - 0.012, u);
    camera.fov = lerp(40, 26, u);
    camera.position.copy(cam);
    camera.lookAt(b.clone().lerp(g, lerp(0.32, 0.58, u)));
  } else {
    const cam = g.clone().addScaledVector(v, -0.28).addScaledVector(side, 0.045);
    cam.y = g.y + 0.012;
    camera.fov = 28;
    camera.position.copy(cam);
    camera.lookAt(g);
  }
  camera.updateProjectionMatrix();
}

function updateScene(screen) {
  const w = worldTime(screen);
  const arr = dust.geometry.attributes.position.array;
  if (!dust.userData.base) dust.userData.base = Float32Array.from(arr);
  const base = dust.userData.base;
  for (let i = 0; i < dustN; i++) {
    arr[i * 3] = base[i * 3] + Math.sin(w * 0.7 + i) * 0.01;
    arr[i * 3 + 1] = base[i * 3 + 1] + Math.sin(w * 1.3 + i * 1.7) * 0.008;
    arr[i * 3 + 2] = base[i * 3 + 2] + Math.cos(w * 0.5 + i) * 0.008;
  }
  dust.geometry.attributes.position.needsUpdate = true;
  dust.visible = screen > 1.15 && screen < 16.2;
  poseBall(screen);
  poseHand(screen);
  poseShards(screen);
  poseCamera(screen);
}

function samplesFor(screen) {
  // O antebraço percorre muito pixel no obturador. Poucos passes viram faixas.
  if (screen < 0.02) return 8;
  if (screen < 0.25) return 64;
  if (screen < 0.48) return 8;
  if (screen < 1.05) return 3;
  return 1;
}

function renderFrame(n) {
  const samples = samplesFor(n / FPS);
  ctx2.setTransform(1, 0, 0, 1, 0, 0);
  ctx2.globalCompositeOperation = "source-over";
  ctx2.globalAlpha = 1;
  ctx2.fillStyle = "#000000";
  ctx2.fillRect(0, 0, W, H);
  const shutter = samples === 1 ? 0 : 0.5;
  for (let i = 0; i < samples; i++) {
    const sub = samples === 1 ? 0 : ((i + 0.5) / samples - 0.5) * shutter;
    updateScene((n + sub) / FPS);
    renderer.render(scene, camera);
    // Média incremental em source-over: o passe i entra com alfa 1/(i+1),
    // o que dá peso igual 1/n sobre o preto. Nunca "lighter" — soma e estoura.
    ctx2.globalCompositeOperation = "source-over";
    ctx2.globalAlpha = 1 / (i + 1);
    ctx2.drawImage(glCanvas, 0, 0, W, H);
  }
  ctx2.globalAlpha = 1;
  ctx2.globalCompositeOperation = "source-over";
  const b = ball.position;
  const gp = gapWorld();
  return { screen: n / FPS, ball: [b.x, b.y, b.z], gap: gp, samples };
}

function gapWorld() {
  const place = glassPlacement();
  const contact = new THREE.Vector3(place.worldContact.x, place.worldContact.y, place.worldContact.z);
  const surface = ball.position.clone().add(new THREE.Vector3(place.dir.x, 0, place.dir.z).multiplyScalar(BALL_R));
  return surface.distanceTo(contact);
}

window.renderFrame = renderFrame;
window.__size = { W, H };
const handText = await (await fetch("./hand.obj")).text();
const handGeo = parseOBJ(handText);
handGeo.computeVertexNormals();
hand.add(new THREE.Mesh(handGeo, skinMat));
window.__ready = true;
