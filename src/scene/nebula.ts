// Procedural nebulae as point clouds of soft, overlapping gas puffs. Each is authored facing +Z, which
// the layer turns toward Earth, so dark dust can be cut out as silhouettes in the XY plane: you arrive
// looking at it the way telescopes do.
import { gauss, rng, unitVec } from '../lib/random.ts';
import { mix, type Cloud, type RGB } from './cloud.ts';

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
// hydrogen-alpha red/pink, doubly ionized oxygen teal, sulfur/nitrogen orange, hot young stars
const HA: RGB = [1, 0.28, 0.42], OIII: RGB = [0.25, 0.85, 0.9], SII: RGB = [1, 0.55, 0.28], HOT: RGB = [0.75, 0.85, 1];

/** Smooth 3D value noise in 0..1, and ridged fbm: bright sheets and filaments where the noise crosses its midline. */
function hash(x: number, y: number, z: number) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x1b873593);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}
export function noise(x: number, y: number, z: number) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  const f = (t: number) => t * t * (3 - 2 * t), u = f(x - X), v = f(y - Y), w = f(z - Z);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(hash(X, Y, Z), hash(X + 1, Y, Z), u), l(hash(X, Y + 1, Z), hash(X + 1, Y + 1, Z), u), v),
    l(l(hash(X, Y, Z + 1), hash(X + 1, Y, Z + 1), u), l(hash(X, Y + 1, Z + 1), hash(X + 1, Y + 1, Z + 1), u), v), w);
}
export function ridged(x: number, y: number, z: number) {
  let sum = 0, amp = 0.5;
  for (let o = 0; o < 4; o++, x *= 2.03, y *= 2.03, z *= 2.03, amp *= 0.5) sum += amp * (1 - Math.abs(2 * noise(x, y, z) - 1));
  return sum / 0.9375;
}

const pusher = (c: Cloud, bright: number) => (x: number, y: number, z: number, col: RGB, b: number, size: number) =>
  c.push(x, y, z, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);

/**
 * Star-forming (emission) nebula: turbulent gas as clumps within clumps, glowing teal near the hot
 * central stars and red further out, with dark dust clouds, an optional dust lane and dust pillars.
 */
export function addEmission(c: Cloud, { count, radius: R, seed = 1, bright = 1, stars = 1, lane = 0, pillars = 0 }: {
  count: number; radius: number; seed?: number; bright?: number; stars?: number; lane?: number; pillars?: number;
}) {
  const r = rng(seed), push = pusher(c, bright);
  const blobs: number[][] = [];
  for (let i = 0; i < 7; i++) {
    const b = [gauss(r) * R * 0.32, gauss(r) * R * 0.28, gauss(r) * R * 0.2, R * (0.22 + 0.2 * r())];
    blobs.push(b);
    for (let j = 0; j < 6; j++) blobs.push([b[0] + gauss(r) * b[3] * 0.6, b[1] + gauss(r) * b[3] * 0.6, b[2] + gauss(r) * b[3] * 0.4, b[3] * (0.2 + 0.3 * r())]);
  }
  const dust = Array.from({ length: 9 }, () => [gauss(r) * R * 0.4, gauss(r) * R * 0.35, R * (0.05 + 0.1 * r())]);
  const towers = Array.from({ length: pillars }, (_, k) => ({ x: R * (-0.28 + 0.24 * k + gauss(r) * 0.03), y: -R * 0.8, h: R * (0.4 + 0.35 * r()), w: R * (0.05 + 0.03 * r()), lean: gauss(r) * 0.12, seed: k * 7.3 }));
  // pillar half-width at height t (0 base … 1 top): tapering, lumpy, with a rounded head
  const width = (p: (typeof towers)[number], t: number) => p.w * (1 - 0.3 * t) * (0.75 + 0.5 * noise(t * 6 + p.seed, p.seed, 0)) * Math.sqrt(Math.max(0, 1 - ((t - 0.85) / 0.15) ** 2 * (t > 0.85 ? 1 : 0)));
  // how much light from (x, y) is blocked by foreground dust: 0 = clear, 1 = opaque
  const shade = (x: number, y: number) => {
    let s = 0;
    for (const [dx, dy, dr] of dust) s = Math.max(s, smooth(dr, dr * 0.4, Math.hypot(x - dx, y - dy)) * 0.85);
    if (lane) s = Math.max(s, smooth(R * 0.08, R * 0.02, Math.abs(y + 0.3 * x - R * 0.05)) * 0.9);
    for (const p of towers) {
      const t = (y - p.y) / p.h;
      if (t > 0 && t < 1) { const w = width(p, t); s = Math.max(s, smooth(w, w * 0.55, Math.abs(x - p.x - p.lean * t * p.h)) * 0.95); }
    }
    return s;
  };
  for (let i = 0; i < count; i++) {
    const [bx, by, bz, s] = blobs[Math.floor(r() * blobs.length)];
    const x = bx + gauss(r) * s * 0.7, y = by + gauss(r) * s * 0.7, z = bz + gauss(r) * s * 0.5;
    const d = Math.hypot(x, y, z) / R;
    const col = mix(mix(OIII, HA, smooth(0.08, 0.55, d)), SII, r() < 0.15 ? 0.6 : 0);
    const wisp = ridged(x / R * 2.2 + seed, y / R * 2.2, z / R * 2.2) ** 4; // turbulent filaments and sheets
    push(x, y, z, col, (0.05 + 0.5 * wisp) * (0.6 + r() * 0.8) * Math.exp(-d * 1.1) * (1 - shade(x, y)), 2.5 + r() * 3);
  }
  // bright rims where starlight eats into the dust pillars, and their dim dusty bodies
  for (const p of towers) for (let i = 0; i < count * 0.02; i++) {
    const t = r(), side = r() < 0.5 ? -1 : 1, w = width(p, t), cx = p.x + p.lean * t * p.h;
    const rim = r() < 0.7, x = rim ? cx + side * w * (0.75 + 0.2 * r()) : cx + gauss(r) * w * 0.45;
    // lit rims (brightest toward the top, which faces the hot stars), and faint dusty bodies
    push(x, p.y + t * p.h, gauss(r) * w * 0.5, rim ? mix(SII, HA, r()) : [0.45, 0.28, 0.2], rim ? (0.12 + r() * 0.2) * (0.4 + t) : 0.03, rim ? 1.3 : 2.5);
  }
  // the young stars lighting it up: a dense cluster at the core plus scattered ones
  for (let i = 0; i < count * 0.012 * stars; i++) {
    const core = r() < 0.5, s = core ? R * 0.08 : R * 0.45;
    push(gauss(r) * s, gauss(r) * s, gauss(r) * s * 0.6, HOT, 0.6 + r() * 0.9, core && r() < 0.06 ? 3.5 : 1.3 + r());
  }
  for (let i = 0; i < count * 0.05; i++) {
    const [bx, by, bz, s] = blobs[Math.floor(r() * 7) * 7];
    const x = bx + gauss(r) * s * 0.6, y = by + gauss(r) * s * 0.6, d = Math.hypot(x, y) / R;
    push(x, y, bz + gauss(r) * s * 0.3, mix(OIII, HA, smooth(0.1, 0.5, d)), 0.03 * (1 - shade(x, y)), 10 + r() * 4);
  }
}

/**
 * Planetary nebula: the shell of gas a dying Sun-like star blew off, teal inside and red at the edge,
 * around its white-dwarf core; optional cometary knots (Helix) and a second bubble plus faint outer
 * shells (Cat's Eye).
 */
export function addPlanetary(c: Cloud, { count, radius: R, seed = 1, bright = 1, axis = 0.8, knots = 0, shells = 0, torus = 0 }: {
  count: number; radius: number; seed?: number; bright?: number; axis?: number; knots?: number; shells?: number;
  /** Squash the shell into a thick ring around our line of sight (the Ring and Helix are barrels seen end-on). */
  torus?: number;
}) {
  const r = rng(seed), push = pusher(c, bright);
  const dir = () => unitVec(r);
  for (let i = 0; i < count * 0.75; i++) {
    let [ux, uy, uz] = dir();
    if (torus) { uz *= 1 - torus * 0.8; const l = Math.hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l; }
    const k = Math.min(1, Math.max(0.05, 0.64 + gauss(r) * 0.07)); // densest in a shell
    let x = ux * k * R, y = uy * k * R * axis;
    const z = uz * k * R * axis;
    if (shells && r() < 0.5) [x, y] = [y * 0.9, x * 0.9]; // a second bubble across the first: the Cat's Eye's "pupil"
    const tex = 0.3 + 1.2 * ridged(x / R * 3 + seed, y / R * 3, z / R * 3) ** 3;
    push(x, y, z, mix(OIII, HA, smooth(0.5, 0.75, k)), (0.1 + r() * 0.1) * (0.6 + k) * tex, 2.2 + r() * 1.8);
  }
  // faint teal fill, and a wisp of red halo outside the bright shell
  for (let i = 0; i < count * 0.15; i++) {
    const [ux, uy, uz] = dir(), k = r() < 0.6 ? r() * 0.5 : 0.9 + r() * 0.35;
    push(ux * k * R, uy * k * R * axis, uz * k * R * axis, k < 0.6 ? OIII : HA, k < 0.6 ? 0.08 : 0.05, 3 + r() * 2);
  }
  // cometary knots: dense droplets on the inner edge with tails pointing away from the star
  for (let i = 0; i < count * 0.08 * knots; i++) {
    const [ux, uy, uz] = dir(), k = 0.45 + r() * 0.12, t = r() ** 2 * 0.12;
    push(ux * (k + t) * R, uy * (k + t) * R * axis, uz * (k + t) * R * axis, mix(SII, HA, r()), 0.5 * (1 - t * 6), 1.4);
  }
  for (let i = 0; i < count * 0.12 * shells; i++) {
    const [ux, uy, uz] = dir(), k = 1.1 + Math.floor(r() * 5) * 0.12 + gauss(r) * 0.01;
    push(ux * k * R, uy * k * R, uz * k * R, HA, 0.06, 2.2);
  }
  for (let i = 0; i < 40; i++) push(gauss(r) * R * 0.01, gauss(r) * R * 0.01, gauss(r) * R * 0.01, HOT, 1.4, i ? 1.2 : 4); // white dwarf
}

/** Supernova remnant (Crab): a blue synchrotron glow laced with red and orange filaments, around a spinning pulsar. */
export function addRemnant(c: Cloud, { count, radius: R, seed = 1, bright = 1 }: { count: number; radius: number; seed?: number; bright?: number }) {
  const r = rng(seed), push = pusher(c, bright);
  for (let i = 0; i < count * 0.3; i++)
    push(gauss(r) * R * 0.32, gauss(r) * R * 0.24, gauss(r) * R * 0.24, [0.5, 0.62, 1], 0.12 + r() * 0.1, 3 + r() * 2.5);
  // filaments: wandering threads of gas from the inner cloud out to the edge
  const n = 450, per = Math.round((count * 0.65) / n);
  for (let f = 0; f < n; f++) {
    const z0 = r() * 2 - 1, p0 = r() * TAU, s0 = Math.sqrt(1 - z0 * z0);
    let [x, y, z] = [s0 * Math.cos(p0) * 1.35, s0 * Math.sin(p0), z0].map((v) => v * R * (0.6 + 0.35 * r()));
    const col = mix(SII, HA, r()), step = R * 0.005;
    let [dx, dy, dz] = [x, y, z].map((v) => v / R);
    for (let i = 0; i < per; i++) {
      // wander mostly sideways, so threads trace the shell instead of shooting straight out
      dx += gauss(r) * 0.4; dy += gauss(r) * 0.4; dz += gauss(r) * 0.4;
      const l = Math.hypot(dx, dy, dz) || 1;
      x += (dx / l) * step; y += (dy / l) * step; z += (dz / l) * step;
      if (Math.hypot(x / 1.35, y, z) > R) break;
      // brightest toward the outer shell, where the filaments pile up
      const out = smooth(0.4, 0.95, Math.hypot(x / 1.35, y, z) / R);
      push(x + gauss(r) * step * 0.4, y + gauss(r) * step * 0.4, z, r() < 0.12 ? [0.7, 1, 0.45] : col, (0.06 + r() * 0.1) * (0.3 + out), 1 + r() * 0.6);
    }
  }
  for (let i = 0; i < 30; i++) push(gauss(r) * R * 0.005, gauss(r) * R * 0.005, gauss(r) * R * 0.005, HOT, 1.5, i ? 1.2 : 3.5); // pulsar
}
