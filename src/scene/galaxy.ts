// Procedural point clouds: galaxies (authored in their own plane, z = thickness) and the cosmic web.
import { Vector3 } from 'three';
import { gauss, rng } from '../lib/coords.ts';
import type { cloud } from './PointCloud.tsx';

type Cloud = ReturnType<typeof cloud>;

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
export function addSpiral(c: Cloud, { count, radius: R, arms = 4, pitchDeg = 13, cx = 0, seed = 1, bright = 1, bulge = 0.1, bulgeSize = 0.09, bar = 0, lane = 0.5, companion = 0 }: {
  count: number; radius: number; arms?: number; pitchDeg?: number; cx?: number; seed?: number; bright?: number;
  bulge?: number; bulgeSize?: number; bar?: number; lane?: number; companion?: number;
}) {
  const r = rng(seed);
  const k = 1 / Math.tan((pitchDeg * Math.PI) / 180);
  const r0 = Math.max(R * 0.08, bar * R); // the arms start at the bar's ends
  const h = R * 0.012, sep = TAU / arms;
  const armAt = (d: number, arm: number) => arm * sep + Math.log(d / r0) * k;
  const push = (x: number, y: number, z: number, col: RGB, b: number, size: number) =>
    c.push(x + cx, y, z, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);
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
    return [d * Math.cos(th) + cx, d * Math.sin(th), z, core ? CORE : YOUNG, (core ? 0.07 : 0.035) * bright * (lane > 1 ? midplane(z) : 1)];
  });
  // a small companion at the tip of the first arm (the Whirlpool's NGC 5195)
  if (companion) {
    const th = armAt(R * 0.95, 0) + 0.25;
    addElliptical(c, { count: Math.round(count * companion * 0.35), radius: R * companion, axis: 0.7, cx: cx + R * 1.05 * Math.cos(th), cy: R * 1.05 * Math.sin(th), seed: seed + 99, bright: bright * 1.3 });
  }
}

/** Elliptical galaxy: a dense core fading into a wide halo of old stars, with globular clusters; optional dust lane and jet. */
export function addElliptical(c: Cloud, { count, radius: R, axis = 0.75, cx = 0, cy = 0, seed = 1, bright = 1, lane = 0, jet = 0 }: {
  count: number; radius: number; axis?: number; cx?: number; cy?: number; seed?: number; bright?: number; lane?: number; jet?: number;
}) {
  const r = rng(seed), a = R * 0.12;
  const push = (x: number, y: number, z: number, col: RGB, b: number, size: number) =>
    c.push(x + cx, y + cy, z, col[0] * b * bright, col[1] * b * bright, col[2] * b * bright, size);
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
    const d = Math.abs(gauss(r)) * R * 0.18, cz = r() * 2 - 1, ph = r() * TAU, s = Math.sqrt(1 - cz * cz);
    return [d * s * Math.cos(ph) + cx, d * s * Math.sin(ph) + cy, d * cz * axis, CORE, 0.08 * bright];
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
