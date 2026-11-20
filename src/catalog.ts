// Every clickable/searchable object, with a live position in world meters.
import { HelioVector } from 'astronomy-engine';
import { Vector3 } from 'three';
import { AU, KPC, MPC, PC, eqjToScene, galDir, galToScene, radecDir } from './lib/coords.ts';
import { formatSize } from './lib/scale.ts';
import { starRadiusSun, starTemp } from './lib/stars.ts';
import { LAYERS } from './data/layers.ts';
import { BODIES, HELIO_OBJECTS, PROBES, SUN } from './data/solarSystem.ts';
import { SATELLITES } from './data/satellites.ts';
import { satOffset } from './lib/satellites.ts';
import { FAMOUS_STARS, STARS } from './data/stars.ts';
import { EXOMOONS, EXOPLANETS, HOST_RADIUS, exoOffset, exoType, moonOffset } from './data/exoplanets.ts';
import { GALAXIES, LOCAL_GROUP_CENTER as LGC, MILKY_WAY, NEBULAE, NORMA, OBSERVABLE_UNIVERSE, SGR_A, STRUCTURES, SUPERCLUSTERS, superclusterLayout } from './data/deepSky.ts';

export interface CatalogObject {
  id: string;
  name: string;
  type: string;
  size?: string;
  fact: string;
  /** True radius in meters, when it's a solid body we can zoom onto. */
  radiusM?: number;
  /** Zoom (log10 m) used by "Fly to", and the closest the camera may get. */
  viewLogD: number;
  minLogD: number;
  /** Solar-system objects move; their distance is live. */
  live?: boolean;
  /** Low Earth orbit: the camera rides along on the outward side, and the card shows altitude. */
  earthOrbit?: boolean;
  /** For a planet of another star: that star's catalog id. */
  host?: string;
  /** Where "Fly to" puts the camera, as a unit vector from the object (scene frame). */
  viewDir?: Vector3;
  /** World position in meters (heliocentric, scene frame). Returned vectors are shared: don't mutate. */
  pos: (t: Date) => Vector3;
}

const ORIGIN = new Vector3();
const shown = (layer: number) => LAYERS[layer - 1].fade[1];

const cache = new Map<string, { t: number; v: Vector3 }>();
function helio(o: (typeof BODIES)[number], t: Date) {
  const hit = cache.get(o.id);
  if (hit && hit.t === t.getTime()) return hit.v;
  const h = HelioVector(o.body, t);
  const v = eqjToScene(h.x, h.y, h.z).multiplyScalar(AU);
  cache.set(o.id, { t: t.getTime(), v });
  return v;
}

const solid = (radiusKm: number, view: number) => ({
  radiusM: radiusKm * 1e3,
  size: formatSize(radiusKm * 1e3),
  minLogD: Math.log10(radiusKm * 1e3 * 1.3),
  viewLogD: Math.log10(radiusKm * 1e3 * view),
  live: true,
});

const SPECTRAL: Record<string, string> = {
  O: 'A rare, blazing-hot blue star that will live only a few million years.',
  B: 'A hot blue-white star, thousands of times brighter than the Sun.',
  A: 'A white star, hotter and more massive than the Sun.',
  F: 'A yellow-white star, a little hotter than the Sun.',
  G: 'A yellow star much like our Sun.',
  K: 'An orange star, cooler and longer-lived than the Sun.',
  M: 'A red dwarf. Three in four stars in the Milky Way are like this, and they can shine for trillions of years.',
  D: 'A white dwarf: the Earth-sized, cooling core left behind by a dead Sun-like star.',
};

export const CATALOG: CatalogObject[] = [
  { ...SUN, ...solid(SUN.radiusKm, 6), pos: () => ORIGIN },
  ...BODIES.map((b) => ({ ...b, ...solid(b.radiusKm, b.id === 'earth' ? 5.6 : 4.5), pos: (t: Date) => helio(b, t) })),
  ...SATELLITES.map((s) => ({
    id: s.id, name: s.name, type: s.type, size: s.size, fact: s.fact, live: true, earthOrbit: true, viewLogD: s.viewLogD, minLogD: 5.3,
    pos: (t: Date) => {
      const off = satOffset(s.norad, t);
      const earth = get('earth').pos(t);
      return off ? earth.clone().add(off) : earth;
    },
  })),
  ...PROBES.map((p) => {
    const dir = radecDir(p.ra, p.dec);
    const epoch = Date.parse(p.epoch);
    return {
      id: p.id, name: p.name, type: 'Interstellar spacecraft', fact: p.fact, size: 'about 3.7 m dish', live: true,
      viewLogD: 14.0, minLogD: shown(4),
      pos: (t: Date) => dir.clone().multiplyScalar((p.distAU + (p.auPerYear * (t.getTime() - epoch)) / 3.15576e10) * AU),
    };
  }),
  ...HELIO_OBJECTS.map((h) => ({
    id: h.id, name: h.name, type: h.type, fact: h.fact, size: `${formatSize(h.radiusAU * AU)}`,
    viewLogD: Math.log10(h.radiusAU * AU * 3.2), minLogD: shown(4), pos: () => ORIGIN,
  })),
  ...STARS.map(([name, x, y, z, , absmag, bv, spect], i) => {
    const t = starTemp(bv);
    const p = eqjToScene(x, y, z).multiplyScalar(PC);
    const est = starRadiusSun(absmag, t), rSun = HOST_RADIUS[name] ?? (Number.isFinite(est) ? est : 1), R = rSun * SUN.radiusKm * 1e3;
    const planets = EXOPLANETS.filter((e) => e.host === name);
    const fact = FAMOUS_STARS[name] ?? SPECTRAL[spect[0]] ?? 'One of the Sun\'s stellar neighbors.';
    // fly right up to its surface, like the Sun's; a star with planets frames its whole system first
    return {
      id: `star-${i}`, name, type: `Star · ${spect.replace(/\.+$/, '') || 'unknown class'}`,
      size: `≈ ${rSun.toPrecision(2)} × the Sun's radius`, radiusM: R,
      fact: planets.length ? `${fact} It has ${planets.length === 1 ? 'one known planet' : `${planets.length} known planets`}: fly in to explore.` : fact,
      viewLogD: planets.length ? Math.log10(Math.max(...planets.map((e) => e.a)) * AU * 2.6) : Math.log10(R * 6),
      minLogD: Math.log10(R * 1.3), pos: () => p,
    };
  }),
  ...EXOPLANETS.map((e) => {
    const host = STARS.findIndex((s) => s[0] === e.host), [, x, y, z] = STARS[host];
    const star = eqjToScene(x, y, z).multiplyScalar(PC), v = new Vector3();
    return {
      id: e.id, name: e.name, type: `Exoplanet · ${exoType(e)}`, fact: `${e.fact} Discovered ${e.year}.`, host: `star-${host}`,
      ...solid(e.radiusEarth * 6371, 4.5),
      pos: (t: Date) => exoOffset(e, t.getTime(), v).multiplyScalar(AU).add(star),
    };
  }),
  ...EXOMOONS.map((m) => {
    const v = new Vector3();
    return {
      id: m.id, name: m.name, type: 'Exomoon candidate', host: `star-${STARS.findIndex((s) => s[0] === EXOPLANETS.find((e) => e.id === m.planet)!.host)}`, fact: `${m.fact} Reported ${m.year}.`,
      ...solid(m.radiusEarth * 6371, 4.5),
      pos: (t: Date) => moonOffset(m, t.getTime(), v).multiplyScalar(AU).add(get(m.planet).pos(t)),
    };
  }),
  (() => {
    const p = galToScene(MILKY_WAY.sunDistKpc, 0, 0).multiplyScalar(KPC);
    return { ...MILKY_WAY, size: formatSize(MILKY_WAY.diameterKpc * KPC / 2), viewLogD: 21.05, minLogD: shown(6), pos: () => p };
  })(),
  (() => {
    const p = galToScene(MILKY_WAY.sunDistKpc, 0, 0).multiplyScalar(KPC), rs = SGR_A.horizonKm * 1e3;
    // The disk's true orientation isn't known, so it is drawn level (in the scene's XZ plane), which keeps
    // it horizontal on screen. Arrive 7° above it, so its far side shows lifted over the shadow.
    const viewDir = new Vector3(0, Math.sin(0.12), Math.cos(0.12));
    return { ...SGR_A, viewDir, viewLogD: Math.log10(rs * 26), minLogD: Math.log10(rs * 6), pos: () => p };
  })(),
  ...GALAXIES.map((g) => {
    const dir = galDir(g.l, g.b), p = dir.clone().multiplyScalar(g.distKpc * KPC), D = g.diameterKpc * KPC;
    // arrive on our side, so it looks the way telescopes see it; it may be explored from the inside
    return { ...g, size: formatSize(D / 2), viewLogD: Math.log10(D * 1.4), minLogD: Math.max(19.6, Math.log10(D * 0.15)), viewDir: dir.negate(), pos: () => p };
  }),
  ...NEBULAE.map((n) => {
    const dir = radecDir(n.ra, n.dec), p = dir.clone().multiplyScalar(n.distPc * PC), D = n.sizePc * PC;
    return { ...n, size: formatSize(D / 2), viewLogD: Math.log10(D * 1.5), minLogD: Math.log10(D * 0.1), viewDir: dir.negate(), pos: () => p };
  }),
  (() => {
    const mw = galToScene(MILKY_WAY.sunDistKpc, 0, 0);
    const m31 = galDir(GALAXIES[0].l, GALAXIES[0].b).multiplyScalar(GALAXIES[0].distKpc);
    const p = mw.lerp(m31, LGC.towardAndromeda).multiplyScalar(KPC);
    return { ...LGC, size: formatSize((LGC.diameterMpc * MPC) / 2), viewLogD: 22.75, minLogD: shown(7), pos: () => p };
  })(),
  ...STRUCTURES.map((s) => {
    const p = galDir(s.l, s.b).multiplyScalar(s.distMpc * MPC);
    // the Great Attractor is a place you can fly into; the others are just marked on the cosmic web
    if (s.id === 'great-attractor') return { ...s, size: formatSize((s.sizeMpc * MPC) / 2), viewLogD: Math.log10(s.sizeMpc * MPC * 1.3), minLogD: Math.log10(2 * MPC), pos: () => p };
    return { ...s, size: formatSize((s.sizeMpc * MPC) / 2), viewLogD: Math.max(shown(8), Math.log10(s.sizeMpc * MPC * 4)), minLogD: shown(8), pos: () => p };
  }),
  ...SUPERCLUSTERS.map((s) => {
    const p = new Vector3(...superclusterLayout(s, galDir).center).multiplyScalar(MPC), D = s.sizeMpc * MPC;
    // Laniakea surrounds us, so it's framed from wherever you are. The others are seen from 70° off our
    // line of sight: from behind Earth, our own neighborhood would sit in the foreground, in the way.
    const toUs = p.clone().normalize().negate(), side = new Vector3().crossVectors(toUs, new Vector3(0, 1, 0)).normalize();
    return { ...s, size: formatSize(D / 2), viewLogD: Math.log10(D * (s.flow ? 1.7 : 1.4)), minLogD: Math.log10(D * 0.06), viewDir: s.flow ? undefined : toUs.applyAxisAngle(side, 1.22), pos: () => p };
  }),
  (() => {
    const dir = galDir(NORMA.l, NORMA.b), p = dir.clone().multiplyScalar(NORMA.distMpc * MPC);
    return { ...NORMA, size: formatSize((NORMA.sizeMpc * MPC) / 2), viewLogD: Math.log10(NORMA.sizeMpc * MPC * 1.1), minLogD: Math.log10(0.3 * MPC), viewDir: dir.negate(), pos: () => p };
  })(),
  { ...OBSERVABLE_UNIVERSE, size: formatSize(OBSERVABLE_UNIVERSE.radiusMpc * MPC), viewLogD: 26.85, minLogD: shown(8), pos: () => ORIGIN },
];

export const byId = new Map(CATALOG.map((o) => [o.id, o]));
export const get = (id: string) => byId.get(id)!;
