// Confirmed planets around nearby stars (NASA Exoplanet Archive values, rounded). Radii are measured
// where a planet transits (TRAPPIST-1, 55 Cancri e), otherwise estimated from its minimum mass.
import { Quaternion, Vector3 } from 'three';
import type { Look } from './solarSystem.ts';

type Kind = 'lava' | 'rocky' | 'temperate' | 'ice' | 'super' | 'neptune' | 'hot' | 'giant';

export interface Exoplanet {
  id: string;
  name: string;
  /** Host star's name in the star catalog. */
  host: string;
  /** Orbit radius (AU), period (days), radius (Earths), year discovered. */
  a: number; periodDays: number; radiusEarth: number; year: number;
  kind: Kind;
  fact: string;
}

const KIND: Record<Kind, { type: string; look: Look }> = {
  lava: { type: 'Lava world', look: { colors: ['#2b1b15', '#e0662a', '#120b09'], bands: 0, turb: 0, rim: 0.3 } },
  rocky: { type: 'Rocky planet', look: { colors: ['#6d6259', '#ad9d8c', '#433a34'], bands: 0, turb: 0, rim: 0 } },
  temperate: { type: 'Rocky planet, in the habitable zone', look: { colors: ['#6f5a49', '#b8977a', '#3c4a5a'], bands: 0, turb: 0, rim: 0.45 } },
  ice: { type: 'Icy rocky planet', look: { colors: ['#93a9b8', '#e3edf2', '#647989'], bands: 0, turb: 0, rim: 0.3 } },
  super: { type: 'Super-Earth', look: { colors: ['#7b6b55', '#c4b190', '#4b4134'], bands: 0, turb: 0, rim: 0.4 } },
  neptune: { type: 'Neptune-like planet', look: { colors: ['#3a62b8', '#86a9ea', '#24407e'], bands: 9, turb: 2, rim: 0.7 } },
  hot: { type: 'Hot Jupiter', look: { colors: ['#3d2a26', '#9a5e44', '#1d1312'], bands: 16, turb: 4, rim: 0.5 } },
  giant: { type: 'Gas giant', look: { colors: ['#a58a66', '#ece0c8', '#8f5d3e'], bands: 22, turb: 3, rim: 0.35 } },
};
export const exoType = (p: Exoplanet) => KIND[p.kind].type;
export const exoLook = (p: Exoplanet) => KIND[p.kind].look;

/** True radii (Suns) of host stars: the catalog's magnitude-based estimate badly undersizes red dwarfs. */
export const HOST_RADIUS: Record<string, number> = {
  'Proxima Centauri': 0.154, "Barnard's Star": 0.187, 'Lalande 21185': 0.392, Ran: 0.735, 'Ross 128': 0.197, "Luyten's Star": 0.35,
  'Wolf 1061': 0.307, 'Gl 876': 0.376, 'Gl 581': 0.299, 'Gl 667C': 0.42, Copernicus: 0.943, Titawin: 1.48, Chalawan: 1.17,
  Pollux: 9.06, Errai: 4.9, 'TRAPPIST-1': 0.119, 'Gl 54.1': 0.157, 'GJ 1061': 0.156, 'Lacaille 9352': 0.47, 'Groombridge 34': 0.38,
  'Gl 892': 0.778, 'Gl 674': 0.36, 'Gl 687': 0.42, 'Gl 832': 0.48, 'Gl 849': 0.46, 'Gl 357': 0.337, 'Kepler-1625': 1.79, 'Kepler-1708': 1.12,
};

const p = (id: string, name: string, host: string, a: number, periodDays: number, radiusEarth: number, kind: Kind, year: number, fact: string): Exoplanet =>
  ({ id: `exo-${id}`, name, host, a, periodDays, radiusEarth, kind, year, fact });

const TRAPPIST = 'Seven Earth-sized planets circle TRAPPIST-1, all closer to it than Mercury is to the Sun.';
const BARNARD = 'One of four small rocky planets found around Barnard\'s Star in 2024–25, all too hot for liquid water.';

export const EXOPLANETS: Exoplanet[] = [
  p('proxima-d', 'Proxima d', 'Proxima Centauri', 0.0289, 5.122, 0.81, 'rocky', 2022, 'About a quarter of Earth\'s mass: one of the lightest planets ever found from the wobble it gives its star.'),
  p('proxima-b', 'Proxima b', 'Proxima Centauri', 0.0486, 11.187, 1.07, 'temperate', 2016, 'The closest known planet outside the solar system, in the zone where liquid water could exist. Its year lasts 11 days.'),
  p('barnard-d', 'Barnard d', "Barnard's Star", 0.0188, 2.34, 0.66, 'rocky', 2025, BARNARD),
  p('barnard-b', 'Barnard b', "Barnard's Star", 0.0229, 3.154, 0.7, 'rocky', 2024, BARNARD),
  p('barnard-c', 'Barnard c', "Barnard's Star", 0.0274, 4.124, 0.72, 'rocky', 2025, BARNARD),
  p('barnard-e', 'Barnard e', "Barnard's Star", 0.0381, 6.739, 0.62, 'rocky', 2025, BARNARD),
  p('lalande-b', 'Lalande 21185 b', 'Lalande 21185', 0.0788, 12.946, 1.3, 'super', 2019, 'A super-Earth around one of the brightest red dwarfs in our sky, just 8.3 light-years away.'),
  p('aegir', 'Ægir (Epsilon Eridani b)', 'Ran', 3.53, 2692, 11, 'giant', 2000, 'A Jupiter-like giant circling a young, Sun-like star only 10.5 light-years away, in a system with two dusty asteroid belts.'),
  p('ross-128-b', 'Ross 128 b', 'Ross 128', 0.0496, 9.866, 1.1, 'temperate', 2017, 'An Earth-sized world around an unusually calm red dwarf. In about 79,000 years Ross 128 will be the closest star to the Sun.'),
  p('luyten-c', 'Luyten c', "Luyten's Star", 0.0365, 4.723, 1.05, 'rocky', 2017, 'The inner, hotter of Luyten\'s Star\'s two known planets.'),
  p('luyten-b', 'Luyten b', "Luyten's Star", 0.0911, 18.65, 1.33, 'temperate', 2017, 'A super-Earth in the habitable zone. In 2017 a message of music and science was beamed toward it; it arrives in 2029.'),
  p('wolf-1061-b', 'Wolf 1061 b', 'Wolf 1061', 0.0375, 4.887, 1.19, 'rocky', 2015, 'A hot rocky planet on a 5-day orbit.'),
  p('wolf-1061-c', 'Wolf 1061 c', 'Wolf 1061', 0.089, 17.87, 1.39, 'temperate', 2015, 'A super-Earth near the inner edge of the habitable zone, one of the closest potentially habitable worlds.'),
  p('wolf-1061-d', 'Wolf 1061 d', 'Wolf 1061', 0.47, 217.2, 1.7, 'ice', 2015, 'The outermost known planet of Wolf 1061, likely frozen.'),
  p('gl-876-d', 'Gliese 876 d', 'Gl 876', 0.0208, 1.938, 1.65, 'lava', 2005, 'One of the first super-Earths ever found around a normal star. Its year is under two days.'),
  p('gl-876-c', 'Gliese 876 c', 'Gl 876', 0.13, 30.1, 11, 'giant', 2001, 'Locked in step with its neighbors: c, b and e orbit in a 1 : 2 : 4 rhythm.'),
  p('gl-876-b', 'Gliese 876 b', 'Gl 876', 0.208, 61.1, 11.5, 'giant', 1998, 'The first planet ever found around a red dwarf, twice Jupiter\'s mass.'),
  p('gl-876-e', 'Gliese 876 e', 'Gl 876', 0.334, 124.3, 3.9, 'neptune', 2010, 'A Uranus-mass world finishing the 1 : 2 : 4 resonance with c and b.'),
  p('gl-581-e', 'Gliese 581 e', 'Gl 581', 0.0285, 3.149, 1.15, 'rocky', 2009, 'Only about twice Earth\'s mass, it was the lightest planet known around a normal star when found.'),
  p('gl-581-b', 'Gliese 581 b', 'Gl 581', 0.0406, 5.369, 4, 'neptune', 2005, 'A Neptune-mass planet hugging its red dwarf on a 5-day orbit.'),
  p('gl-581-c', 'Gliese 581 c', 'Gl 581', 0.073, 12.92, 1.6, 'super', 2007, 'Hailed in 2007 as the first potentially habitable exoplanet; now thought to be too hot.'),
  p('gl-667c-b', 'Gliese 667 Cb', 'Gl 667C', 0.0505, 7.2, 1.6, 'super', 2009, 'A hot super-Earth in a triple-star system.'),
  p('gl-667c-c', 'Gliese 667 Cc', 'Gl 667C', 0.125, 28.14, 1.45, 'temperate', 2011, 'In the habitable zone of a red dwarf in a triple-star system: two orange suns would shine in its sky.'),
  p('janssen', 'Janssen (55 Cancri e)', 'Copernicus', 0.0154, 0.7365, 1.88, 'lava', 2004, 'A lava world so close to its star that a year lasts 18 hours. Its dayside is hot enough to melt rock.'),
  p('galileo', 'Galileo (55 Cancri b)', 'Copernicus', 0.1134, 14.65, 11, 'hot', 1996, 'A warm giant, the first planet found in the 55 Cancri system.'),
  p('brahe', 'Brahe (55 Cancri c)', 'Copernicus', 0.2373, 44.4, 6.5, 'neptune', 2002, 'About 50 times Earth\'s mass, between Neptune and Saturn.'),
  p('harriot', 'Harriot (55 Cancri f)', 'Copernicus', 0.781, 260, 6, 'neptune', 2007, 'Orbits in its star\'s habitable zone, but as a gas world it has no surface.'),
  p('lipperhey', 'Lipperhey (55 Cancri d)', 'Copernicus', 5.96, 5574, 11, 'giant', 2002, 'A Jupiter-like giant at about Jupiter\'s distance from its Sun-like star.'),
  p('saffar', 'Saffar (Upsilon Andromedae b)', 'Titawin', 0.0595, 4.617, 14, 'hot', 1996, 'A hot Jupiter whose dayside is over 1,000 °C hotter than its nightside.'),
  p('samh', 'Samh (Upsilon Andromedae c)', 'Titawin', 0.829, 241.3, 11.5, 'giant', 1999, 'Upsilon Andromedae was the first Sun-like star found to have more than one planet.'),
  p('majriti', 'Majriti (Upsilon Andromedae d)', 'Titawin', 2.53, 1276, 11, 'giant', 1999, 'A giant over four times Jupiter\'s mass in the outer system.'),
  p('taphao-thong', 'Taphao Thong (47 UMa b)', 'Chalawan', 2.1, 1078, 11.5, 'giant', 1996, 'One of the first long-period giant planets found, circling a Sun-like star much as Jupiter circles ours.'),
  p('taphao-kaew', 'Taphao Kaew (47 UMa c)', 'Chalawan', 3.6, 2391, 11, 'giant', 2002, 'A Saturn-like partner further out in the 47 Ursae Majoris system.'),
  p('thestias', 'Thestias (Pollux b)', 'Pollux', 1.64, 589.6, 11.5, 'giant', 2006, 'A giant planet around Pollux, an orange giant: the brightest star in our sky known to host a planet.'),
  p('tadmor', 'Tadmor (Gamma Cephei Ab)', 'Errai', 2.05, 903, 11, 'giant', 2003, 'Suspected back in 1988, it was one of the first exoplanets ever proposed. Its star has a red-dwarf companion.'),
  p('yz-ceti-b', 'YZ Ceti b', 'Gl 54.1', 0.0163, 2.02, 0.9, 'rocky', 2017, 'Radio bursts from its star, seen in 2023, hint that this planet has a magnetic field like Earth\'s.'),
  p('yz-ceti-c', 'YZ Ceti c', 'Gl 54.1', 0.0216, 3.06, 1.04, 'rocky', 2017, 'One of three small rocky planets packed tightly around the red dwarf YZ Ceti.'),
  p('yz-ceti-d', 'YZ Ceti d', 'Gl 54.1', 0.0285, 4.66, 1.02, 'rocky', 2017, 'The outermost of YZ Ceti\'s three known planets, still far too hot for liquid water.'),
  p('gj-1061-b', 'GJ 1061 b', 'GJ 1061', 0.021, 3.204, 1.09, 'rocky', 2019, 'A hot rocky planet around one of the 20 closest stars to the Sun.'),
  p('gj-1061-c', 'GJ 1061 c', 'GJ 1061', 0.035, 6.689, 1.16, 'temperate', 2019, 'In the habitable zone of a calm red dwarf just 12 light-years away.'),
  p('gj-1061-d', 'GJ 1061 d', 'GJ 1061', 0.054, 13.03, 1.14, 'temperate', 2019, 'At the cool outer edge of its star\'s habitable zone.'),
  p('lacaille-9352-b', 'Lacaille 9352 b', 'Lacaille 9352', 0.068, 9.26, 1.47, 'super', 2020, 'A hot super-Earth around one of the brightest red dwarfs in our sky.'),
  p('lacaille-9352-c', 'Lacaille 9352 c', 'Lacaille 9352', 0.12, 21.79, 1.7, 'super', 2020, 'A super-Earth just inside the warm edge of the habitable zone.'),
  p('gj-15a-b', 'Groombridge 34 Ab', 'Groombridge 34', 0.072, 11.44, 1.35, 'super', 2014, 'A hot super-Earth in a pair of red dwarfs that circle each other every few thousand years.'),
  p('gj-15a-c', 'Groombridge 34 Ac', 'Groombridge 34', 5.4, 7600, 5.5, 'neptune', 2018, 'A cold world about 36 times Earth\'s mass, taking over 20 years to orbit.'),
  p('hd-219134-b', 'HD 219134 b', 'Gl 892', 0.0388, 3.093, 1.6, 'lava', 2015, 'When found, the closest rocky planet known to cross in front of its star, letting astronomers measure its size directly.'),
  p('hd-219134-c', 'HD 219134 c', 'Gl 892', 0.065, 6.765, 1.51, 'rocky', 2015, 'A second transiting rocky world, about 1.5 times Earth\'s width.'),
  p('hd-219134-f', 'HD 219134 f', 'Gl 892', 0.146, 22.72, 1.7, 'super', 2015, 'A super-Earth in a packed system of six planets.'),
  p('hd-219134-d', 'HD 219134 d', 'Gl 892', 0.237, 46.86, 2.2, 'super', 2015, 'About 16 times Earth\'s mass: a large super-Earth or a small Neptune.'),
  p('hd-219134-g', 'HD 219134 g', 'Gl 892', 0.375, 94.2, 2.0, 'super', 2015, 'About 11 times Earth\'s mass, near the warm edge of the habitable zone.'),
  p('hd-219134-h', 'HD 219134 h', 'Gl 892', 3.11, 2100, 9, 'giant', 2015, 'A Saturn-like giant on the outskirts of the system.'),
  p('gj-674-b', 'GJ 674 b', 'Gl 674', 0.039, 4.694, 3.5, 'neptune', 2007, 'A Neptune-mass planet whipping around its red dwarf in under five days.'),
  p('gj-687-b', 'GJ 687 b', 'Gl 687', 0.164, 38.14, 4, 'neptune', 2014, 'A Neptune-mass world around one of the closest stars in the northern sky.'),
  p('gj-832-b', 'GJ 832 b', 'Gl 832', 3.4, 3660, 11, 'giant', 2008, 'A Jupiter-like giant around a red dwarf, at roughly Jupiter\'s distance from the Sun.'),
  p('gj-849-b', 'GJ 849 b', 'Gl 849', 2.35, 1882, 11, 'giant', 2006, 'One of the few Jupiter-mass planets known around a red dwarf.'),
  p('gj-357-b', 'GJ 357 b', 'Gl 357', 0.035, 3.93, 1.22, 'rocky', 2019, 'A hot Earth found by the TESS satellite as it crossed in front of its star.'),
  p('gj-357-c', 'GJ 357 c', 'Gl 357', 0.061, 9.12, 1.4, 'super', 2019, 'A super-Earth between the hot inner planet and the habitable-zone world d.'),
  p('gj-357-d', 'GJ 357 d', 'Gl 357', 0.204, 55.7, 1.6, 'temperate', 2019, 'A super-Earth in the habitable zone: with a thick enough atmosphere it could hold liquid water.'),
  p('kepler-1625-b', 'Kepler-1625 b', 'Kepler-1625', 0.874, 287.4, 11.4, 'giant', 2016, 'A Jupiter-sized giant about 8,000 light-years away, with a possible Neptune-sized moon.'),
  p('kepler-1708-b', 'Kepler-1708 b', 'Kepler-1708', 1.64, 737.1, 10, 'giant', 2021, 'A Jupiter-sized giant about 5,500 light-years away, with a possible moon 2.6 times Earth\'s width.'),
  p('trappist-1b', 'TRAPPIST-1b', 'TRAPPIST-1', 0.01154, 1.511, 1.116, 'rocky', 2016, 'The Webb telescope measured its dayside at about 230 °C, with no thick atmosphere. ' + TRAPPIST),
  p('trappist-1c', 'TRAPPIST-1c', 'TRAPPIST-1', 0.0158, 2.422, 1.097, 'rocky', 2016, TRAPPIST),
  p('trappist-1d', 'TRAPPIST-1d', 'TRAPPIST-1', 0.02227, 4.05, 0.788, 'temperate', 2016, 'At the warm inner edge of the habitable zone. ' + TRAPPIST),
  p('trappist-1e', 'TRAPPIST-1e', 'TRAPPIST-1', 0.02925, 6.1, 0.92, 'temperate', 2017, 'Perhaps the best bet for liquid water: close to Earth\'s size, density and warmth. ' + TRAPPIST),
  p('trappist-1f', 'TRAPPIST-1f', 'TRAPPIST-1', 0.03849, 9.207, 1.045, 'temperate', 2017, 'In the habitable zone; it could hold a deep ocean or thick ice. ' + TRAPPIST),
  p('trappist-1g', 'TRAPPIST-1g', 'TRAPPIST-1', 0.04683, 12.35, 1.129, 'ice', 2017, 'The largest of the seven, at the cold outer edge of the habitable zone. ' + TRAPPIST),
  p('trappist-1h', 'TRAPPIST-1h', 'TRAPPIST-1', 0.06189, 18.77, 0.755, 'ice', 2017, 'The outermost and coldest, probably frozen solid. ' + TRAPPIST),
];

/** Each system's orbital plane, tilted a little (seeded by the host's name) so orbits show as ellipses. */
const tilts = new Map<string, Quaternion>();
export function systemTilt(host: string) {
  let q = tilts.get(host);
  if (!q) {
    let h = 7;
    for (const ch of host) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const a = ((h & 1023) / 1023) * Math.PI * 2, tilt = 0.25 + (((h >> 10) & 255) / 255) * 0.35;
    q = new Quaternion().setFromAxisAngle(new Vector3(Math.cos(a), 0, Math.sin(a)), tilt);
    tilts.set(host, q);
  }
  return q;
}

const J2000 = Date.UTC(2000, 0, 1, 12);
/** Planet's offset from its star (AU) at time `ms`, or at fraction `f` of an orbit from J2000. Circular orbits. */
export function exoOffset(pl: Exoplanet, ms: number, out = new Vector3()) {
  let h = 0;
  for (const ch of pl.id) h = (h * 33 + ch.charCodeAt(0)) | 0;
  const th = ((h & 4095) / 4095) * Math.PI * 2 + (2 * Math.PI * (ms - J2000)) / (pl.periodDays * 864e5);
  return out.set(Math.cos(th) * pl.a, 0, -Math.sin(th) * pl.a).applyQuaternion(systemTilt(pl.host));
}

/**
 * No moon of an exoplanet has been confirmed. These are the two strongest candidates, each spotted as an
 * extra dip in its planet's transit light; both are still debated.
 */
export interface Exomoon { id: string; name: string; planet: string; km: number; periodDays: number; radiusEarth: number; year: number; fact: string }
export const EXOMOONS: Exomoon[] = [
  { id: 'exo-kepler-1625-b-i', name: 'Kepler-1625 b-i (candidate)', planet: 'exo-kepler-1625-b', km: 3.2e6, periodDays: 22, radiusEarth: 4, year: 2018,
    fact: 'A candidate moon as big as Neptune, far larger than any moon in our solar system. Not yet confirmed.' },
  { id: 'exo-kepler-1708-b-i', name: 'Kepler-1708 b-i (candidate)', planet: 'exo-kepler-1708-b', km: 7.6e5, periodDays: 4.6, radiusEarth: 2.6, year: 2021,
    fact: 'A candidate moon about 2.6 times Earth\'s width, found in old Kepler data. Not yet confirmed.' },
];

/** Moon's offset from its planet (AU) at time `ms`, on a tilted circular orbit. */
export function moonOffset(m: Exomoon, ms: number, out = new Vector3()) {
  const th = (2 * Math.PI * (ms - J2000)) / (m.periodDays * 864e5);
  return out.set(Math.cos(th), 0, -Math.sin(th)).multiplyScalar((m.km * 1e3) / 1.495978707e11).applyQuaternion(systemTilt(m.id));
}
