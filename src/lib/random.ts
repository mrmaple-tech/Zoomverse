// Seeded randomness for procedural content (kept dependency-free so the cloud worker stays small).

/** Small seeded PRNG so procedural layers look the same every visit. */
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
/** A random direction, uniform over the sphere. */
export function unitVec(r: () => number): [number, number, number] {
  const z = r() * 2 - 1, p = r() * 2 * Math.PI, s = Math.sqrt(1 - z * z);
  return [s * Math.cos(p), s * Math.sin(p), z];
}
