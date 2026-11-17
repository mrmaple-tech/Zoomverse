// Light paths around a non-spinning (Schwarzschild) black hole, in units of its event-horizon radius rs.
// A photon's path is exactly that of a Newtonian particle under a = -1.5 h² r / |r|⁵, h = |r × v|.
// The black hole shader runs this same integrator per pixel; this copy exists so it can be tested.

/** Step length as a fraction of the distance to the hole (shared with the shader). */
export const STEP = 0.08;
/** Give up after this many steps: only rays circling the photon sphere get here. */
export const MAX_STEPS = 220;

/**
 * Total bend (radians) of a ray arriving from `far` rs away with impact parameter `b`,
 * or null if it falls through the horizon.
 */
export function deflection(b: number, far = 2000, maxSteps = 100_000) {
  let x = -far, y = b, vx = 1, vy = 0;
  const h2 = b * b;
  const acc = () => -1.5 * h2 / (x * x + y * y) ** 2.5;
  let a = acc();
  for (let i = 0; i < maxSteps; i++) {
    const r = Math.hypot(x, y);
    if (r < 1) return null;
    if (r > far * 1.001 && x * vx + y * vy > 0) return Math.atan2(-vy, vx);
    const dt = STEP * r;
    vx += a * x * dt * 0.5; vy += a * y * dt * 0.5; // leapfrog: half kick, drift, half kick
    x += vx * dt; y += vy * dt;
    a = acc();
    vx += a * x * dt * 0.5; vy += a * y * dt * 0.5;
  }
  return null;
}
