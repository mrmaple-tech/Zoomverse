import raw from './stars.json';

/** HYG v4.1 row, trimmed: [name, x, y, z (pc, equatorial J2000), apparent mag, absolute mag, B−V color index, spectral type]. */
export type StarRow = [string, number, number, number, number, number, number, string];
// TRAPPIST-1 is too faint for the catalog's cut, but it's the most famous planetary system beyond ours.
// Kepler-1625 and -1708 (far beyond the catalog, positions approximate) host the two best exomoon candidates.
// catalog abbreviations people wouldn't search for
const RENAME: Record<string, string> = { 'Tau Cet': 'Tau Ceti', Ran: 'Epsilon Eridani' };
export const STARS = [
  ...(raw as StarRow[]).map((s) => (s[0] in RENAME ? [RENAME[s[0]], ...s.slice(1)] as StarRow : s)),
  ['TRAPPIST-1', 12.085, -2.874, -1.096, 18.8, 18.4, 2.0, 'M8V'],
  ['Kepler-1625', 807.6, -1698.4, 1571.2, 15.8, 3.85, 0.75, 'G'],
  ['Kepler-1708', 433, -1146, 1179, 15.2, 4.0, 0.55, 'F'],
] as StarRow[];

/** Stars that get a permanent label and a fun fact. Names match HYG `proper` names. */
export const FAMOUS_STARS: Record<string, string> = {
  'Proxima Centauri': 'The closest star to the Sun. It hosts at least one Earth-sized planet in its habitable zone.',
  'Rigil Kentaurus': 'Alpha Centauri A, the brighter half of the nearest Sun-like star system.',
  Sirius: 'The brightest star in the night sky. It has a white-dwarf companion, Sirius B.',
  "Barnard's Star": 'Has the fastest apparent motion across our sky of any star.',
  'Wolf 359': 'A tiny red dwarf; Star Trek fans know it as the site of a famous battle.',
  Procyon: 'Its name means "before the dog": it rises just before Sirius, the Dog Star.',
  Altair: 'Spins so fast it bulges: its equator is about 20% wider than its poles.',
  Vega: 'The original zero-point of the astronomical magnitude scale, and our future pole star (~12,000 years).',
  Fomalhaut: 'Surrounded by a vast dusty debris disk, like a young solar system.',
  Arcturus: 'An orange giant racing through the Milky Way\'s disk at about 122 km/s relative to the Sun.',
  Capella: 'Actually four stars: two yellow giants and a pair of red dwarfs.',
  Aldebaran: 'The "eye" of Taurus. Pioneer 10 is heading roughly its way, arriving in about 2 million years.',
  Polaris: 'The North Star, a Cepheid variable that pulses every four days.',
  Canopus: 'The second-brightest star in the night sky; spacecraft use it for navigation.',
  Spica: 'A tight binary whose two stars are distorted into egg shapes by each other\'s gravity.',
  Antares: 'A red supergiant so large it would swallow the orbit of Mars.',
  Betelgeuse: 'A red supergiant expected to go supernova within ~100,000 years. It dimmed dramatically in 2019–20.',
  Rigel: 'A blue supergiant roughly 100,000 times more luminous than the Sun.',
  'TRAPPIST-1': 'A dim red dwarf barely bigger than Jupiter, with seven Earth-sized planets: three of them in the zone where liquid water could exist.',
  'Kepler-1625': 'A Sun-like star about 8,000 light-years away whose giant planet may have a Neptune-sized moon.',
  'Kepler-1708': 'A star about 5,500 light-years away whose giant planet may have a moon, one of the two best exomoon candidates.',
  Deneb: 'One of the most luminous stars visible to the naked eye, yet over 400 parsecs away.',
  'Tau Ceti': 'The nearest single Sun-like star, about 12 light-years away. In 1960 it was one of the first two stars searched for alien radio signals.',
  'Epsilon Eridani': 'A young, active orange star about 10.5 light-years away, wrapped in rings of dust like a young solar system. In 1960 it was the other star in that first search for alien signals.',
  "Kapteyn's Star": 'An ancient star about 13 light-years away that orbits the galaxy backward compared with the Sun. It may have come from the dwarf galaxy whose core became Omega Centauri.',
  "Van Maanen's Star": 'The closest solitary white dwarf. A 1917 spectrum of it, showing metals from rocky debris falling onto it, is now recognized as the earliest evidence of planets around another star.',
  Pollux: 'The nearest giant star to the Sun, an orange giant about 34 light-years away.',
  Castor: 'Looks like one star but is six: three pairs of stars, all orbiting one another.',
  Regulus: 'Spins once every 16 hours, so fast that it is flattened: its equator is about a third wider than its poles.',
  Algol: 'The "Demon Star": every 2.87 days it dims for about 10 hours, as a fainter companion passes in front of it.',
  Mizar: 'With faint Alcor beside it in the Big Dipper\'s handle, a traditional test of eyesight. Mizar is itself four stars, and Alcor two.',
  Dubhe: 'One of the Big Dipper\'s two "pointer stars": follow the line from Merak through Dubhe to find Polaris.',
  Achernar: 'One of the flattest stars known: it spins so fast that its equator is about 35% wider than its poles.',
  Alnilam: 'The middle star of Orion\'s Belt: a blue supergiant hundreds of thousands of times brighter than the Sun.',
  Naos: 'Zeta Puppis, one of the hottest and most massive stars visible to the naked eye, a blue supergiant at about 40,000 K.',
  Eltanin: 'By measuring this star in the 1720s, James Bradley discovered that Earth\'s motion tilts incoming starlight: the first direct proof that Earth orbits the Sun.',
};
