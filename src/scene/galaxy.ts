// Procedural point clouds: galaxies (authored in their own plane, z = thickness) and the cosmic web.
import { Vector3 } from 'three';
import { gauss, rng } from '../lib/random.ts';
import type { Cloud } from './cloud.ts';


type RGB = readonly [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const CORE: RGB = [1, 0.8, 0.55], OLD: RGB = [0.9, 0.82, 0.7], YOUNG: RGB = [0.6, 0.73, 1], HII: RGB = [1, 0.4, 0.6], GAS: RGB = [1, 0.32, 0.38];
const TAU = Math.PI * 2;

/** Soft glow: big, faint points, so dense regions read as light rather than grain. */
function haze(c: Cloud, r: () => number, n: number, at: () => [number, number, number, RGB, number]) {
  for (let i = 0; i < n; i++) {
    const [x, y, z, col, b] = at();
    c.push(x, y, z, col[0] * b * 0.4, col[1] * b * 0.4, col[2] * b * 0.4, 9 + r() * 5); // ~2.5× the area of the old haze
  }
}

/**
 * Spiral galaxy in its own plane (z = thickness): a warm bulge (and optional bar), trailing log-spiral arms
 * of young blue stars with pink star-forming knots, dust lanes on the arms' inner edges and in the midplane
 * (visible edge-on), and an older, yellower disk between the arms.
 */
export function addSpiral(c: Cloud, { count, radius: R, arms = 4, pitchDeg = 13, cx = 0, cy = 0, seed = 1, bright = 1, bulge = 0.1, bulgeSize = 0.09, bar = 0, lane = 0.5, companion = 0, eye = 0 }: {
  count: number; radius: number; arms?: number; pitchDeg?: number; cx?: number; cy?: number; seed?: number; bright?: number;
  bulge?: number; bulgeSize?: number; bar?: number; lane?: number; companion?: number;
  /** A dark band of dust curving across one side of the nucleus (the Black Eye Galaxy). */
  eye?: number;
}) {
  const r = rng(seed);
  const k = 1 / Math.tan((pitchDeg * Math.PI) / 180);
  const r0 = Math.max(R * 0.08, bar * R); // the arms start at the bar's ends
  const h = R * 0.012, sep = TAU / arms;
  const armAt = (d: number, arm: number) => arm * sep + Math.log(d / r0) * k;
  const push = (x: number, y: number, z: number, col: RGB, b: number, size: number) => {
    if (eye && x * 0.6 + y > R * 0.02) {
      const d = Math.hypot(x, y);
      if (d > R * 0.06 && d < R * 0.24) b *= 0.12;
    }
    c.push(x + cx, y + cy, z, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);
  };
  const knots = Array.from({ length: Math.round(arms * 40) }, () => {
    const d = R * (0.2 + 0.7 * r()), th = armAt(d, Math.floor(r() * arms)) + gauss(r) * 0.06;
    return [d * Math.cos(th), d * Math.sin(th), gauss(r) * h * 0.4];
  });
  const barF = bar ? 0.08 : 0;
  const midplane = (z: number) => (Math.abs(z) < h * lane ? (lane > 1 ? 0.1 : 0.45) : 1);
  for (let i = 0; i < count; i++) {
    const kind = r();
    if (kind < bulge) {
      const s = R * bulgeSize;
      const x = gauss(r) * s, y = gauss(r) * s, z = gauss(r) * s * 0.65;
      push(x, y, z, mix(CORE, OLD, Math.min(1, Math.hypot(x, y, z) / (2 * s))), (0.3 + r() * 0.35) * midplane(z), 1 + r() * 1.2);
    } else if (kind < bulge + barF) {
      push((r() * 2 - 1) * r0, gauss(r) * r0 * 0.14, gauss(r) * h, mix(CORE, OLD, r()), 0.3 + r() * 0.3, 1 + r());
    } else if (kind < bulge + barF + 0.03) {
      // star-forming knot: a tight clump of glowing pink gas or hot blue stars on an arm
      const [kx, ky, kz] = knots[Math.floor(r() * knots.length)], s = R * (0.006 + r() * 0.01), pink = r() < 0.5;
      push(kx + gauss(r) * s, ky + gauss(r) * s, kz + gauss(r) * s * 0.4, pink ? HII : YOUNG, 0.35 + r() * 0.45, pink ? 1.7 : 1.4);
    } else {
      const d = Math.min(R, R * 0.05 + (-Math.log(1 - r() * 0.98) * R) / 4);
      const arm = Math.floor(r() * arms), onArm = d > r0 && r() < 0.7;
      const w = 0.18 + 0.1 * (arm % 2); // arms 0 and 2 are the major ones
      const th = onArm ? armAt(d, arm) + gauss(r) * w : r() * TAU;
      const z = gauss(r) * h;
      const t = Math.min(1, d / (R * 0.55));
      let b = 0.22 + r() * 0.38;
      if (d > r0) {
        // signed angle to the nearest arm; positive = its inner (concave) edge, where dust collects
        const m = ((((th - armAt(d, 0)) % sep) + sep) % sep), off = m < sep / 2 ? m : m - sep;
        if (off > 0.05 && off < 0.2) b *= 0.25;
      }
      push(d * Math.cos(th), d * Math.sin(th), z, onArm ? mix(OLD, YOUNG, t) : mix(CORE, OLD, t), b * midplane(z), 1 + r() * 1.2);
    }
  }
  haze(c, r, count * 0.05, () => {
    const core = r() < 0.3;
    const d = core ? Math.abs(gauss(r)) * R * Math.max(0.12, bulgeSize * 1.2) : R * (0.1 + 0.75 * r() ** 1.5);
    const th = core ? r() * TAU : armAt(Math.max(d, r0), Math.floor(r() * arms)) + gauss(r) * 0.15;
    const z = gauss(r) * (core ? d * 0.5 : R * 0.008);
    return [d * Math.cos(th) + cx, d * Math.sin(th) + cy, z, core ? CORE : YOUNG, (core ? 0.07 : 0.035) * bright * (lane > 1 ? midplane(z) : 1)];
  });
  // a small companion at the tip of the first arm (the Whirlpool's NGC 5195)
  if (companion) {
    const th = armAt(R * 0.95, 0) + 0.25;
    addElliptical(c, { count: Math.round(count * companion * 0.35), radius: R * companion, axis: 0.7, cx: cx + R * 1.05 * Math.cos(th), cy: cy + R * 1.05 * Math.sin(th), seed: seed + 99, bright: bright * 1.3 });
  }
}

/** Elliptical galaxy: a dense core fading into a wide halo of old stars, with globular clusters; optional dust lane and jet. */
export function addElliptical(c: Cloud, { count, radius: R, axis = 0.75, cx = 0, cy = 0, cz = 0, seed = 1, bright = 1, lane = 0, jet = 0 }: {
  count: number; radius: number; axis?: number; cx?: number; cy?: number; cz?: number; seed?: number; bright?: number; lane?: number; jet?: number;
}) {
  const r = rng(seed), a = R * 0.12;
  const push = (x: number, y: number, z: number, col: RGB, b: number, size: number) =>
    c.push(x + cx, y + cy, z + cz, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);
  for (let i = 0; i < count; i++) {
    const u = Math.sqrt(r() * 0.97), d = (a * u) / (1 - u); // Hernquist profile
    if (d > R) { i--; continue; } // resample rather than pile the tail up into a hard edge
    const cz = r() * 2 - 1, ph = r() * TAU, s = Math.sqrt(1 - cz * cz);
    const x = d * s * Math.cos(ph), y = d * s * Math.sin(ph), z = d * cz * axis;
    // softened core (it otherwise saturates to a white blob) and a halo that fades out instead of ending
    let b = (0.22 + r() * 0.33) * (0.3 + 0.7 * Math.min(1, d / (a * 0.8))) * (1 - (d / R) ** 2);
    if (lane && Math.abs(z) < R * 0.03 * lane && Math.hypot(x, y) < R * 0.55) b *= 0.12;
    push(x, y, z, mix(CORE, OLD, Math.min(1, (d / R) * 1.6)), b, 1 + r() * 1.1);
  }
  // globular clusters: compact, bright points scattered through the halo
  for (let i = 0; i < Math.max(12, count * 0.002); i++) {
    const d = R * (0.15 + 0.85 * r()), cz = r() * 2 - 1, ph = r() * TAU, s = Math.sqrt(1 - cz * cz);
    push(d * s * Math.cos(ph), d * s * Math.sin(ph), d * cz * axis, OLD, 0.9, 1.7);
  }
  haze(c, r, count * 0.04, () => {
    const d = Math.abs(gauss(r)) * R * 0.18, cz0 = r() * 2 - 1, ph = r() * TAU, s = Math.sqrt(1 - cz0 * cz0);
    return [d * s * Math.cos(ph) + cx, d * s * Math.sin(ph) + cy, d * cz0 * axis + cz, CORE, 0.08 * bright];
  });
  // relativistic jet along the pole: a narrow blue-white beam with bright knots
  for (let i = 0; i < count * 0.012 * Math.sign(jet); i++) {
    const t = r() ** 1.3, knot = 1 + Math.max(0, Math.cos(t * 40)) * 0.8;
    push(gauss(r) * R * 0.002 * (1 + t * 2), gauss(r) * R * 0.002 * (1 + t * 2), t * jet * R, [0.6, 0.78, 1], 1.4 * knot * (1 - t * 0.6), 1.6);
  }
}

/** Irregular galaxy: clumpy, gas-rich, with pink star-forming regions; optionally stretched and with starburst outflows. */
export function addIrregular(c: Cloud, { count, radius, seed = 1, bright = 1, stretch = 1, outflow = 0 }: {
  count: number; radius: number; seed?: number; bright?: number; stretch?: number; outflow?: number;
}) {
  const r = rng(seed), q = Math.sqrt(stretch); // elongated along x, same overall size
  const clumps = Array.from({ length: 9 }, () => [gauss(r) * radius * 0.3 * q, gauss(r) * radius * 0.2, radius * (0.06 + r() * 0.13)]);
  const push = (x: number, y: number, z: number, col: RGB, b: number, size: number) =>
    c.push(x, y, z, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);
  for (let i = 0; i < count; i++) {
    const pick = r();
    // a bright central concentration (the LMC's bar, M82's starburst core), star-forming clumps, a diffuse body
    const [cx, cy, s] = pick < 0.15 ? [0, 0, radius * 0.1] : pick < 0.6 ? clumps[Math.floor(r() * clumps.length)] : [0, 0, radius * 0.3];
    const kind = r();
    if (kind < 0.07) push(cx + gauss(r) * s * 0.5, cy + gauss(r) * s * 0.4, gauss(r) * s * 0.2, HII, 0.6 + r() * 0.5, 2);
    else push(cx + gauss(r) * s * 1.2 * q, cy + gauss(r) * s / q, (gauss(r) * s * 0.4) / q, kind < 0.55 ? YOUNG : OLD, 0.25 + r() * 0.4, 1 + r() * 1.3);
  }
  // starburst winds: red plumes of gas blown out above and below the disk
  for (let i = 0; i < count * outflow; i++) {
    const z = (r() < 0.5 ? -1 : 1) * r() ** 0.7 * radius * 0.9, w = radius * (0.04 + Math.abs(z / radius) * 0.35);
    push(gauss(r) * w, gauss(r) * w * 0.6, z, GAS, 0.7 * (1 - Math.abs(z) / radius), 1.8);
  }
  haze(c, r, count * 0.04, () => {
    const [cx, cy, s] = clumps[Math.floor(r() * clumps.length)];
    return [cx + gauss(r) * s * q, cy + gauss(r) * s / q, gauss(r) * s * 0.3, r() < 0.5 ? YOUNG : HII, 0.04 * bright];
  });
}

/** The three points closest to `a`, nearest first. */
function nearest3(pts: Vector3[], a: Vector3) {
  const best: [number, Vector3][] = [];
  for (const b of pts) {
    if (b === a) continue;
    const d = b.distanceToSquared(a);
    if (best.length === 3 && d >= best[2][0]) continue;
    best.push([d, b]);
    best.sort((x, y) => x[0] - y[0]);
    if (best.length > 3) best.pop();
  }
  return best.map(([, b]) => b);
}

/** Random nodes linked to their 3 nearest neighbors; galaxies scatter along the links and pile up at nodes. */
export function web(c: Cloud, seed: number, nodes: number, rMin: number, rMax: number, scatter: number, perLink: number, perNode: number) {
  const r = rng(seed);
  const pts: Vector3[] = [];
  while (pts.length < nodes) {
    const v = new Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
    if (v.length() > 1) continue;
    v.multiplyScalar(rMax);
    if (v.length() >= rMin) pts.push(v);
  }
  // ponytail: O(n²) neighbor scan (no sorting), fine for a few hundred nodes generated once
  for (const a of pts) {
    const near = nearest3(pts, a);
    for (const b of near) for (let i = 0; i < perLink; i++) {
      const t = r(), s = scatter * (0.5 + 0.5 * Math.abs(2 * t - 1));
      const k = 0.35 + r() * 0.35;
      c.push(a.x + (b.x - a.x) * t + gauss(r) * s, a.y + (b.y - a.y) * t + gauss(r) * s, a.z + (b.z - a.z) * t + gauss(r) * s, 0.5 * k, 0.6 * k, k, 1.2 + r());
    }
    for (let i = 0; i < perNode; i++) {
      const k = 0.5 + r() * 0.5;
      c.push(a.x + gauss(r) * scatter * 1.3, a.y + gauss(r) * scatter * 1.3, a.z + gauss(r) * scatter * 1.3, k, 0.8 * k, 0.62 * k, 1.4 + r() * 1.2);
    }
  }
}

/**
 * Ring galaxy: a yellow core inside a ring of young blue stars and pink star-forming knots, left by a
 * smaller galaxy punching through (Cartwheel), or a near-perfect ring around an empty gap (Hoag's Object).
 */
export function addRing(c: Cloud, { count, radius: R, seed = 1, bright = 1, ringR = 0.8, ringW = 0.06, core = 0.2, coreR = 0.15, inner = 0, spokes = 0 }: {
  count: number; radius: number; seed?: number; bright?: number; ringR?: number; ringW?: number; core?: number; coreR?: number; inner?: number; spokes?: number;
}) {
  const r = rng(seed);
  const push = (x: number, y: number, z: number, col: RGB, b: number, size: number) =>
    c.push(x, y, z, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);
  addElliptical(c, { count: Math.round(count * core), radius: R * coreR, axis: 0.8, seed: seed + 7, bright: bright * 1.2 });
  const phase = r() * TAU;
  for (let i = 0; i < count * (1 - core); i++) {
    const kind = r(), th = r() * TAU, lump = 0.55 + 0.45 * Math.sin(th * 3 + phase) * Math.sin(th * 7 + phase * 2);
    if (spokes && kind < 0.08) {
      // faint spokes between the core and the ring
      const a = (Math.floor(r() * spokes) / spokes) * TAU + gauss(r) * 0.03, d = R * (coreR + (ringR - coreR) * r());
      push(d * Math.cos(a), d * Math.sin(a), gauss(r) * R * 0.005, OLD, 0.25, 1.1);
    } else if (inner && kind < 0.2) {
      const d = R * inner + gauss(r) * R * 0.025;
      push(d * Math.cos(th), d * Math.sin(th), gauss(r) * R * 0.008, mix(CORE, OLD, r()), 0.35 + r() * 0.3, 1.2);
    } else {
      const d = R * ringR + gauss(r) * R * ringW * (0.7 + 0.6 * lump), pink = r() < 0.12;
      push(d * Math.cos(th), d * Math.sin(th), gauss(r) * R * 0.01, pink ? HII : YOUNG, (0.3 + r() * 0.35) * (0.5 + lump) * (pink ? 1.6 : 1), pink ? 1.8 : 1.2);
    }
  }
  haze(c, r, count * 0.04, () => {
    const th = r() * TAU, d = R * ringR + gauss(r) * R * ringW;
    return [d * Math.cos(th), d * Math.sin(th), 0, YOUNG, 0.05 * bright];
  });
}

/** Two spirals colliding (the Antennae): overlapping disks, a starburst where they meet, and two long curved tidal tails. */
export function addMerger(c: Cloud, { count, radius: R, seed = 1, bright = 1 }: { count: number; radius: number; seed?: number; bright?: number }) {
  const r = rng(seed);
  addSpiral(c, { count: Math.round(count * 0.32), radius: R * 0.3, cx: -R * 0.12, cy: R * 0.05, seed, bright, arms: 2, pitchDeg: 22, bulge: 0.14 });
  addSpiral(c, { count: Math.round(count * 0.28), radius: R * 0.26, cx: R * 0.13, cy: -R * 0.06, seed: seed + 1, bright, arms: 2, pitchDeg: 26, bulge: 0.14 });
  const push = (x: number, y: number, z: number, col: RGB, b: number, size: number) =>
    c.push(x, y, z, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);
  for (let i = 0; i < count * 0.06; i++) {
    const pink = r() < 0.6; // the collision squeezes gas into a burst of new stars
    push(gauss(r) * R * 0.09, gauss(r) * R * 0.06, gauss(r) * R * 0.02, pink ? HII : YOUNG, 0.5 + r() * 0.5, pink ? 1.8 : 1.4);
  }
  for (let i = 0; i < count * 0.3; i++) {
    const side = r() < 0.5 ? 1 : -1, t = r() ** 0.8;
    const a = (side > 0 ? 0 : Math.PI) + side * (0.4 + t * 2.3), d = R * (0.2 + 0.8 * t), w = R * (0.012 + 0.035 * t);
    push(d * Math.cos(a) + gauss(r) * w, d * Math.sin(a) * 0.75 + gauss(r) * w, gauss(r) * w * 0.5, mix(YOUNG, OLD, r()), (0.22 + r() * 0.3) * (1 - 0.65 * t), 1 + r());
  }
}

/** A galaxy cluster: a giant central elliptical, thousands of galaxies thickening toward the core
 * (red ellipticals inside, blue spirals outside) and the faint glow of the hot gas filling it. Each galaxy
 * is a small fuzzy clump of points, so zooming in resolves them as blobs, flat disks or round balls. */
export function addCluster(c: Cloud, { count, radius: R, seed = 1, bright = 1, cx = 0, cy = 0, cz = 0, jellyfish = 0 }: {
  count: number; radius: number; seed?: number; bright?: number; cx?: number; cy?: number; cz?: number; jellyfish?: number;
}) {
  const r = rng(seed), rc = R * 0.12;
  const push = (x: number, y: number, z: number, col: RGB, b: number, size: number) =>
    c.push(x + cx, y + cy, z + cz, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);
  const dir = () => { const z = r() * 2 - 1, p = r() * TAU, s = Math.sqrt(1 - z * z); return [s * Math.cos(p), s * Math.sin(p), z]; };
  // big galaxies are rarer but get more stars, so up close they resolve as fuzzy shapes (~23 points each on average)
  const galaxies = Math.round((count * 0.8) / 23);
  for (let g = 0; g < galaxies; g++) {
    const big = r() ** 3, per = 8 + Math.round(big * 60);
    const u = r() * 0.96, d = Math.min(R, rc * Math.sqrt(u / (1 - u))); // King-like profile
    const [ux, uy, uz] = dir(), gx = ux * d, gy = uy * d, gz = uz * d;
    const red = r() < 0.85 - (0.6 * d) / R; // ellipticals dominate the core
    const size = R * 0.004 * (0.5 + big * 2.5);
    // a random disk orientation for spirals
    const [ax, ay, az] = dir(), [bx0, by0, bz0] = dir();
    const k = ax * bx0 + ay * by0 + az * bz0, bx = bx0 - k * ax, by = by0 - k * ay, bz = bz0 - k * az, bl = Math.hypot(bx, by, bz) || 1;
    for (let i = 0; i < per; i++) {
      const s = i === 0 ? 0 : size * Math.abs(gauss(r));
      if (red) push(gx + gauss(r) * s * 0.6, gy + gauss(r) * s * 0.6, gz + gauss(r) * s * 0.6, mix(CORE, OLD, r()), i ? 0.2 : 0.6 + big, i ? 1.2 : 1.6 + big * 2);
      else {
        const a = r() * TAU, w = Math.cos(a) * s, v = Math.sin(a) * s;
        push(gx + ax * w + (bx / bl) * v, gy + ay * w + (by / bl) * v, gz + az * w + (bz / bl) * v, i ? YOUNG : CORE, i ? 0.18 : 0.5 + big, i ? 1.1 : 1.4 + big * 2);
      }
    }
  }
  // the brightest cluster galaxy: a giant elliptical sitting at the bottom of the cluster's gravity well
  addElliptical(c, { count: Math.round(count * 0.06), radius: R * 0.05, axis: 0.8, cx, cy, cz, seed: seed + 3, bright: bright * 0.45 });
  // hot intracluster gas (seen in X-rays): a faint violet glow, brightest in the middle
  for (let i = 0; i < count * 0.06; i++) {
    const [ux, uy, uz] = dir(), d = Math.abs(gauss(r)) * R * 0.3;
    push(ux * d, uy * d, uz * d, [0.55, 0.5, 1], 0.035, 9 + r() * 5);
  }
  // a "jellyfish" galaxy plunging through the gas, its stripped gas trailing behind as a blue tail
  if (jellyfish) {
    const [ux, uy, uz] = dir(), d = R * 0.3, x0 = ux * d, y0 = uy * d, z0 = uz * d;
    for (let i = 0; i < 400; i++) push(x0 + gauss(r) * R * 0.003, y0 + gauss(r) * R * 0.003, z0 + gauss(r) * R * 0.003, CORE, 0.5, 1.3);
    for (let i = 0; i < 1500; i++) {
      const t = r() ** 0.7, w = R * (0.002 + 0.01 * t);
      push(x0 + ux * t * R * 0.08 + gauss(r) * w, y0 + uy * t * R * 0.08 + gauss(r) * w, z0 + uz * t * R * 0.08 + gauss(r) * w, [0.45, 0.65, 1], 0.4 * (1 - t), 1.2);
    }
  }
}

/** A supercluster region: several clusters (x, y, z, radius, share of points), the filaments of galaxies
 * joining each to the first (the heaviest), and a thin haze of field galaxies around them. */
export function addSupercluster(c: Cloud, { count, radius: R, seed = 1, bright = 1, clusters }: {
  count: number; radius: number; seed?: number; bright?: number; clusters: number[];
}) {
  const r = rng(seed), k: number[][] = [];
  for (let i = 0; i < clusters.length; i += 5) k.push(clusters.slice(i, i + 5));
  k.forEach(([x, y, z, cr, share], i) => addCluster(c, { count: Math.round(count * share), radius: cr, seed: seed + i * 13, bright, cx: x, cy: y, cz: z }));
  const push = (x: number, y: number, z: number, col: RGB, b: number) => c.push(x, y, z, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, 1 + r());
  const [hub] = k;
  for (const [x, y, z] of k.slice(1)) for (let i = 0; i < count * 0.05; i++) {
    const t = r(), s = R * 0.02 * (0.4 + 4 * t * (1 - t)); // filaments fatten between their ends
    push(hub[0] + (x - hub[0]) * t + gauss(r) * s, hub[1] + (y - hub[1]) * t + gauss(r) * s, hub[2] + (z - hub[2]) * t + gauss(r) * s, mix(YOUNG, OLD, r()), 0.35);
  }
  for (let i = 0; i < count * 0.12; i++) push(gauss(r) * R * 0.45, gauss(r) * R * 0.45, gauss(r) * R * 0.45, mix(YOUNG, OLD, r()), 0.25);
}
