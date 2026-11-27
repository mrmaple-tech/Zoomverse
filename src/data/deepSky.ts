import { Vector3 } from 'three';
import { galDir } from '../lib/coords.ts';
export interface Galaxy {
  id: string;
  name: string;
  type: string;
  /** Galactic longitude/latitude (deg) and distance (kpc) from the Sun. */
  l: number; b: number; distKpc: number;
  diameterKpc: number;
  shape: 'spiral' | 'irregular' | 'elliptical' | 'ring' | 'merger';
  /** Disk inclination to our line of sight (0 = face-on, 90 = edge-on) and its position angle, degrees. */
  incl: number; pa: number;
  /** Extra generator options (arms, pitch, bulge, dust lane, jet…), see scene/galaxy.ts. */
  opts?: Record<string, number>;
  /** Which zoom range labels it: Local Group giants, the Magellanic Clouds, Andromeda's moons, or beyond. */
  zone: 'local' | 'mc' | 'm31' | 'far' | 'deep';
  fact: string;
}

export const MILKY_WAY = {
  id: 'milky-way', name: 'Milky Way', type: 'Barred spiral galaxy',
  /** The Sun sits ~8.2 kpc from the center; galactic +X points at the center. */
  sunDistKpc: 8.2, diameterKpc: 30, count: 70_000,
  fact: 'Our galaxy holds 100–400 billion stars. The Sun takes ~230 million years to orbit its center once.',
};

/** The black hole at the galactic center (4.3 million solar masses). */
export const SGR_A = {
  id: 'sgr-a', name: 'Sagittarius A* (black hole)', type: 'Supermassive black hole',
  /** Radius of the event horizon. */
  horizonKm: 12.7e6,
  size: 'Event horizon 25 million km across, 18 Suns wide',
  fact: 'Four million Suns of mass, at the center of our galaxy. Its gravity bends light: the far side of its glowing disk appears arched over the top and bottom of its shadow, and the side spinning toward you shines brightest. Hot spots near its inner edge circle at about 30% of the speed of light, roughly once every 45 minutes (sped up here).',
};

export const GALAXIES: Galaxy[] = [
  { id: 'andromeda', name: 'Andromeda (M31)', type: 'Spiral galaxy', l: 121.17, b: -21.57, distKpc: 765, diameterKpc: 46, shape: 'spiral', incl: 77, pa: 38,
    opts: { arms: 2, pitchDeg: 9, bulge: 0.14 }, zone: 'local',
    fact: 'Andromeda is heading toward us at ~110 km/s. The classic forecast has it merging with the Milky Way in about 4.5 billion years, but a 2025 study puts the odds of a merger within 10 billion years near 50/50.' },
  { id: 'triangulum', name: 'Triangulum (M33)', type: 'Spiral galaxy', l: 133.61, b: -31.33, distKpc: 840, diameterKpc: 18.7, shape: 'spiral', incl: 55, pa: 23,
    opts: { arms: 4, pitchDeg: 20, bulge: 0.03 }, zone: 'local',
    fact: 'Under very dark skies, Triangulum is the most distant object most people can see with the naked eye.' },
  { id: 'lmc', name: 'Large Magellanic Cloud', type: 'Irregular dwarf galaxy', l: 280.47, b: -32.89, distKpc: 50, diameterKpc: 9.9, shape: 'irregular', incl: 35, pa: 150,
    opts: { stretch: 1.4 }, zone: 'mc',
    fact: 'Home of supernova 1987A, the closest supernova seen since the invention of the telescope.' },
  { id: 'smc', name: 'Small Magellanic Cloud', type: 'Irregular dwarf galaxy', l: 302.8, b: -44.3, distKpc: 62, diameterKpc: 5.8, shape: 'irregular', incl: 60, pa: 45,
    opts: { stretch: 1.8 }, zone: 'mc',
    fact: 'Ferdinand Magellan\'s crew described both Magellanic Clouds during their 1519 voyage.' },
  { id: 'm32', name: 'M32', type: 'Compact elliptical galaxy', l: 121.15, b: -21.98, distKpc: 763, diameterKpc: 2, shape: 'elliptical', incl: 50, pa: 170,
    opts: { axis: 0.8 }, zone: 'm31',
    fact: 'A small, dense satellite of Andromeda, probably the stripped core of a bigger galaxy that Andromeda tore apart.' },
  { id: 'm110', name: 'M110', type: 'Dwarf elliptical galaxy', l: 120.72, b: -21.14, distKpc: 824, diameterKpc: 5, shape: 'elliptical', incl: 70, pa: 165,
    opts: { axis: 0.5 }, zone: 'm31',
    fact: 'A companion of Andromeda that, unusually for an elliptical, still holds patches of dust and young stars.' },
  { id: 'centaurus-a', name: 'Centaurus A', type: 'Elliptical galaxy with an active black hole', l: 309.52, b: 19.42, distKpc: 3800, diameterKpc: 18, shape: 'elliptical', incl: 88, pa: 20,
    opts: { axis: 0.85, lane: 2 }, zone: 'far',
    fact: 'A dark lane of dust from a spiral galaxy it swallowed crosses its middle, and its black hole blasts out radio jets a million light-years long.' },
  { id: 'cigar', name: 'Cigar Galaxy (M82)', type: 'Starburst galaxy', l: 141.41, b: 40.57, distKpc: 3600, diameterKpc: 12, shape: 'irregular', incl: 82, pa: 65,
    opts: { stretch: 2, outflow: 0.15 }, zone: 'far',
    fact: 'It forms stars about 10 times faster than the Milky Way, and winds from all those young stars blow red plumes of gas out of its disk.' },
  { id: 'pinwheel', name: 'Pinwheel Galaxy (M101)', type: 'Spiral galaxy', l: 102.04, b: 59.77, distKpc: 6400, diameterKpc: 52, shape: 'spiral', incl: 18, pa: 40,
    opts: { arms: 5, pitchDeg: 24, bulge: 0.03 }, zone: 'far',
    fact: 'About 70% wider than the Milky Way and seen face-on. Its lopsided arms are dotted with giant star-forming regions.' },
  { id: 'whirlpool', name: 'Whirlpool Galaxy (M51)', type: 'Grand-design spiral galaxy', l: 104.85, b: 68.56, distKpc: 8600, diameterKpc: 23, shape: 'spiral', incl: 22, pa: 10,
    opts: { arms: 2, pitchDeg: 17, bulge: 0.08, companion: 0.3 }, zone: 'far',
    fact: 'The small galaxy NGC 5195 swinging past it stirs up its sharp spiral arms. In 1845 it became the first galaxy seen to be a spiral.' },
  { id: 'sombrero', name: 'Sombrero Galaxy (M104)', type: 'Spiral galaxy', l: 298.46, b: 51.15, distKpc: 9550, diameterKpc: 15, shape: 'spiral', incl: 87, pa: 0,
    opts: { arms: 2, pitchDeg: 5, bulge: 0.4, bulgeSize: 0.15, lane: 3 }, zone: 'far',
    fact: 'A brilliant bulge of old stars ringed by a dark lane of dust, seen almost exactly edge-on.' },
  { id: 'm87', name: 'M87', type: 'Giant elliptical galaxy', l: 283.78, b: 74.49, distKpc: 16400, diameterKpc: 40, shape: 'elliptical', incl: 60, pa: 20,
    opts: { axis: 0.95, jet: 0.18 }, zone: 'far',
    fact: 'Its central black hole, 6.5 billion times the Sun\'s mass, was the first ever photographed (2019). A jet shoots 5,000 light-years out of its core at nearly light speed.' },
  { id: 'bodes', name: 'Bode\'s Galaxy (M81)', type: 'Spiral galaxy', l: 142.09, b: 40.9, distKpc: 3600, diameterKpc: 27, shape: 'spiral', incl: 59, pa: 150,
    opts: { arms: 2, pitchDeg: 14, bulge: 0.16 }, zone: 'far',
    fact: 'The Cigar Galaxy\'s big neighbor: a close pass between the two, a few hundred million years ago, set off the Cigar\'s burst of star birth.' },
  { id: 'sculptor', name: 'Sculptor Galaxy (NGC 253)', type: 'Starburst spiral galaxy', l: 97.36, b: -87.96, distKpc: 3500, diameterKpc: 27, shape: 'spiral', incl: 78, pa: 50,
    opts: { arms: 2, pitchDeg: 22, bulge: 0.05, lane: 1 }, zone: 'far',
    fact: 'One of the dustiest galaxies known, forming stars so fast that its core is packed with young star clusters.' },
  { id: 'southern-pinwheel', name: 'Southern Pinwheel (M83)', type: 'Barred spiral galaxy', l: 314.58, b: 31.97, distKpc: 4600, diameterKpc: 17, shape: 'spiral', incl: 24, pa: 45,
    opts: { arms: 3, pitchDeg: 20, bulge: 0.06, bar: 0.22 }, zone: 'far',
    fact: 'Six supernovae were spotted in it during the 20th century, among the most of any galaxy.' },
  { id: 'black-eye', name: 'Black Eye Galaxy (M64)', type: 'Spiral galaxy', l: 315.69, b: 84.42, distKpc: 5300, diameterKpc: 16, shape: 'spiral', incl: 60, pa: 110,
    opts: { arms: 2, pitchDeg: 8, bulge: 0.2, eye: 1 }, zone: 'far',
    fact: 'A dark band of dust in front of its bright core gives it the look of a black eye. Its outer gas spins the opposite way to its inner stars.' },
  { id: 'm106', name: 'M106', type: 'Spiral galaxy', l: 138.32, b: 68.84, distKpc: 7600, diameterKpc: 41, shape: 'spiral', incl: 64, pa: 160,
    opts: { arms: 2, pitchDeg: 16, bulge: 0.12, bar: 0.1 }, zone: 'far',
    fact: 'Its active black hole heats gas into two extra \'ghost\' arms that only show up in X-rays and radio waves.' },
  { id: 'sunflower', name: 'Sunflower Galaxy (M63)', type: 'Flocculent spiral galaxy', l: 106.0, b: 74.29, distKpc: 8900, diameterKpc: 30, shape: 'spiral', incl: 56, pa: 105,
    opts: { arms: 9, pitchDeg: 16, bulge: 0.1 }, zone: 'far',
    fact: 'Instead of a few grand arms, it has many short, patchy spiral segments, like the seeds of a sunflower.' },
  { id: 'ngc-1300', name: 'NGC 1300', type: 'Barred spiral galaxy', l: 208.16, b: -55.22, distKpc: 18700, diameterKpc: 33, shape: 'spiral', incl: 35, pa: 15,
    opts: { arms: 2, pitchDeg: 18, bulge: 0.05, bar: 0.4 }, zone: 'far',
    fact: 'A textbook barred spiral: a straight bar of stars runs through its center, with an arm curling off each end.' },
  { id: 'antennae', name: 'Antennae Galaxies', type: 'Colliding galaxies', l: 286.96, b: 42.46, distKpc: 22000, diameterKpc: 110, shape: 'merger', incl: 30, pa: 60,
    zone: 'far',
    fact: 'Two spiral galaxies in mid-collision. The crash flings out two long tails of stars and lights up thousands of new star clusters.' },
  { id: 'cartwheel', name: 'Cartwheel Galaxy', type: 'Ring galaxy', l: 326.31, b: -82.78, distKpc: 150000, diameterKpc: 44, shape: 'ring', incl: 40, pa: 20,
    opts: { ringR: 0.85, ringW: 0.07, core: 0.18, coreR: 0.14, inner: 0.3, spokes: 14 }, zone: 'deep',
    fact: 'A smaller galaxy plunged straight through it, sending a ripple of star birth outward like a stone dropped in a pond.' },
  { id: 'hoags-object', name: 'Hoag\'s Object', type: 'Ring galaxy', l: 31.52, b: 56.45, distKpc: 187000, diameterKpc: 37, shape: 'ring', incl: 15, pa: 0,
    opts: { ringR: 0.78, ringW: 0.05, core: 0.25, coreR: 0.18 }, zone: 'deep',
    fact: 'A nearly perfect ring of blue stars around a yellow core, with an empty gap between. How it formed is still debated.' },
];

export interface Nebula {
  id: string;
  name: string;
  type: string;
  /** Right ascension (hours), declination (deg), distance (pc). */
  ra: number; dec: number; distPc: number;
  sizePc: number;
  shape: 'emission' | 'planetary' | 'remnant';
  opts?: Record<string, number>;
  fact: string;
}

export const NEBULAE: Nebula[] = [
  { id: 'orion-nebula', name: 'Orion Nebula', type: 'Star-forming nebula', ra: 5.588, dec: -5.391, distPc: 412, sizePc: 7.3, shape: 'emission', opts: { stars: 1.2 },
    fact: 'The nearest big star nursery, visible to the naked eye as the fuzzy middle "star" of Orion\'s sword. The four hot Trapezium stars at its heart light up the whole cloud.' },
  { id: 'eagle-nebula', name: 'Eagle Nebula', type: 'Star-forming nebula', ra: 18.313, dec: -13.817, distPc: 1740, sizePc: 21, shape: 'emission', opts: { pillars: 3 },
    fact: 'Home of the Pillars of Creation: towers of cold gas and dust light-years tall, where new stars are forming inside.' },
  { id: 'lagoon-nebula', name: 'Lagoon Nebula', type: 'Star-forming nebula', ra: 18.06, dec: -24.387, distPc: 1250, sizePc: 25, shape: 'emission', opts: { lane: 1 },
    fact: 'A glowing cloud split by a dark lane of dust. Its pink glow is hydrogen gas lit up by hot young stars.' },
  { id: 'carina-nebula', name: 'Carina Nebula', type: 'Star-forming nebula', ra: 10.752, dec: -59.868, distPc: 2300, sizePc: 90, shape: 'emission', opts: { stars: 2, lane: 1 },
    fact: 'One of the largest nebulae in the Milky Way, and home to Eta Carinae, a giant star about 100 times the Sun\'s mass that could explode at any time.' },
  { id: 'crab-nebula', name: 'Crab Nebula', type: 'Supernova remnant', ra: 5.576, dec: 22.015, distPc: 2000, sizePc: 3.4, shape: 'remnant',
    fact: 'The wreck of a star whose explosion Chinese astronomers recorded in 1054. The pulsar at its heart spins 30 times a second.' },
  { id: 'ring-nebula', name: 'Ring Nebula', type: 'Planetary nebula', ra: 18.893, dec: 33.029, distPc: 790, sizePc: 0.4, shape: 'planetary', opts: { axis: 0.8, torus: 1 },
    fact: 'The outer layers a dying Sun-like star threw off, glowing around the white-dwarf core left behind.' },
  { id: 'helix-nebula', name: 'Helix Nebula', type: 'Planetary nebula', ra: 22.494, dec: -20.837, distPc: 200, sizePc: 0.8, shape: 'planetary', opts: { axis: 0.9, knots: 1, torus: 0.7 },
    fact: 'The closest bright planetary nebula, nicknamed the Eye of God. Our Sun will end up looking like this in about 5 billion years.' },
  { id: 'cats-eye-nebula', name: 'Cat\'s Eye Nebula', type: 'Planetary nebula', ra: 17.976, dec: 66.633, distPc: 1000, sizePc: 0.2, shape: 'planetary', opts: { axis: 0.55, shells: 1 },
    fact: 'One of the most intricate nebulae known: its dying star has puffed off a new shell of gas about every 1,500 years.' },
];

/** The group's center of mass sits roughly midway between its two giants. */
export const LOCAL_GROUP_CENTER = {
  id: 'local-group', name: 'Local Group', type: 'Galaxy group', towardAndromeda: 0.5, diameterMpc: 3,
  fact: 'More than 80 galaxies bound by gravity, dominated by the Milky Way and Andromeda, which are falling toward each other.',
};

export interface Structure {
  id: string;
  name: string;
  type: string;
  l: number; b: number; distMpc: number;
  sizeMpc: number;
  fact: string;
}

export const STRUCTURES: Structure[] = [
  { id: 'virgo-cluster', name: 'Virgo Cluster', type: 'Galaxy cluster', l: 283.8, b: 74.5, distMpc: 16.5, sizeMpc: 2.2,
    fact: 'About 1,300 galaxies; its gravity is slowly pulling the Local Group toward it.' },
  { id: 'coma-cluster', name: 'Coma Cluster', type: 'Galaxy cluster', l: 58.1, b: 87.96, distMpc: 99, sizeMpc: 6,
    fact: 'Fritz Zwicky first inferred dark matter in 1933 from how fast its galaxies move.' },
  { id: 'bootes-void', name: 'Boötes Void', type: 'Cosmic void', l: 80, b: 60, distMpc: 210, sizeMpc: 100,
    fact: 'A near-empty sphere ~330 million light-years across with only about 60 galaxies.' },
];

export interface Supercluster {
  id: string;
  name: string;
  type: string;
  sizeMpc: number;
  /** Member clusters (galactic l, b in degrees; distance and radius in Mpc; share of the galaxies). The
   * first is the hub the filaments run to; the supercluster sits at their share-weighted center. */
  members: { name: string; l: number; b: number; distMpc: number; radiusMpc: number; share: number }[];
  /** Show galaxies streaming in toward the hub (Laniakea is defined by that flow). */
  flow?: boolean;
  fact: string;
}

export const SUPERCLUSTERS: Supercluster[] = [
  { id: 'great-attractor', name: 'Great Attractor', type: 'Gravitational anomaly', sizeMpc: 50, flow: true,
    members: [
      { name: 'Norma Cluster', l: 325.3, b: -7.26, distMpc: 68, radiusMpc: 2, share: 0.35 },
      { name: 'CIZA J1324.7−5736', l: 307.4, b: 5.0, distMpc: 74, radiusMpc: 1.2, share: 0.12 },
      { name: 'Centaurus Cluster', l: 302.4, b: 21.6, distMpc: 52, radiusMpc: 1.5, share: 0.2 },
      { name: 'Hydra Cluster', l: 269.6, b: 26.5, distMpc: 50, radiusMpc: 1.3, share: 0.15 },
      { name: 'Pavo II Cluster', l: 332.3, b: -23.6, distMpc: 60, radiusMpc: 1, share: 0.1 },
    ],
    fact: 'A vast concentration of mass about 250 million light-years away, hidden behind the Milky Way\'s disk. It pulls the Milky Way, the Local Group and thousands of other galaxies toward it at hundreds of km/s; the streams of light show that flow.' },
  { id: 'laniakea', name: 'Laniakea Supercluster', type: 'Supercluster (our home)', sizeMpc: 160, flow: true,
    members: [
      { name: 'Norma Cluster', l: 325.3, b: -7.26, distMpc: 68, radiusMpc: 2, share: 0.04 },
      { name: 'Virgo Cluster', l: 283.8, b: 74.5, distMpc: 16.5, radiusMpc: 2.2, share: 0.22 },
      { name: 'Fornax Cluster', l: 236.7, b: -53.6, distMpc: 19, radiusMpc: 0.7, share: 0.07 },
      { name: 'Antlia Cluster', l: 273.0, b: 19.1, distMpc: 40.6, radiusMpc: 0.9, share: 0.08 },
      { name: 'Ophiuchus Cluster', l: 0.6, b: 9.3, distMpc: 120, radiusMpc: 2, share: 0.12 },
      { name: 'Abell 3581', l: 323.1, b: 32.9, distMpc: 92, radiusMpc: 1, share: 0.06 },
      { name: 'Eridanus Cluster', l: 207.6, b: -50.5, distMpc: 23, radiusMpc: 0.8, share: 0.05 },
    ],
    fact: '"Immeasurable heaven" in Hawaiian: our home supercluster, about 520 million light-years across, with some 100,000 galaxies. It was defined in 2014 by mapping which way galaxies are moving: everything inside flows toward the Great Attractor. The Milky Way sits near its edge.' },
  { id: 'virgo-supercluster', name: 'Virgo Supercluster', type: 'Supercluster (part of Laniakea)', sizeMpc: 33,
    members: [
      { name: 'Virgo Cluster', l: 283.8, b: 74.5, distMpc: 16.5, radiusMpc: 2.2, share: 0.45 },
      { name: 'Ursa Major Cluster', l: 145, b: 66, distMpc: 18.6, radiusMpc: 0.8, share: 0.12 },
      { name: 'NGC 5846 Group', l: 0.4, b: 48.8, distMpc: 26, radiusMpc: 0.6, share: 0.07 },
      { name: 'Leo I Group', l: 234, b: 57, distMpc: 10.4, radiusMpc: 0.4, share: 0.05 },
      { name: 'Canes Venatici I Group', l: 140, b: 80, distMpc: 4.3, radiusMpc: 0.5, share: 0.04 },
      { name: 'M81 Group', l: 142, b: 41, distMpc: 3.6, radiusMpc: 0.3, share: 0.03 },
    ],
    fact: 'Our local supercluster, centered on the Virgo Cluster: the Local Group sits on its outskirts. Once thought to be the largest structure around us, it is now known to be one lobe of Laniakea.' },
  { id: 'perseus-pisces', name: 'Perseus–Pisces Supercluster', type: 'Supercluster', sizeMpc: 80,
    members: [
      { name: 'Perseus Cluster', l: 150.6, b: -13.3, distMpc: 75, radiusMpc: 2, share: 0.3 },
      { name: 'Abell 347', l: 141.2, b: -17.6, distMpc: 78, radiusMpc: 0.8, share: 0.1 },
      { name: 'Abell 262', l: 136.6, b: -25.1, distMpc: 70, radiusMpc: 1.2, share: 0.15 },
      { name: 'Pisces Cluster', l: 127, b: -29.6, distMpc: 68, radiusMpc: 0.8, share: 0.1 },
    ],
    fact: 'A long chain of galaxy clusters, one of the largest structures near us. The Perseus Cluster at its end is the brightest cluster in X-rays, and its hot gas "hums" a sound wave 57 octaves below middle C.' },
  { id: 'coma-supercluster', name: 'Coma Supercluster', type: 'Supercluster', sizeMpc: 100,
    members: [
      { name: 'Coma Cluster', l: 58.1, b: 88, distMpc: 99, radiusMpc: 3, share: 0.4 },
      { name: 'Leo Cluster', l: 234.8, b: 73, distMpc: 92, radiusMpc: 2, share: 0.25 },
    ],
    fact: 'Two rich clusters, Coma and Leo, at the heart of the Great Wall of galaxies, one of the first giant structures found in maps of the universe (1989).' },
  { id: 'hercules-supercluster', name: 'Hercules Supercluster', type: 'Supercluster', sizeMpc: 50,
    members: [
      { name: 'Hercules Cluster', l: 31.5, b: 44.5, distMpc: 158, radiusMpc: 1.5, share: 0.3 },
      { name: 'Abell 2147', l: 28.9, b: 44.5, distMpc: 155, radiusMpc: 1.5, share: 0.25 },
      { name: 'Abell 2152', l: 29.9, b: 44, distMpc: 165, radiusMpc: 1, share: 0.15 },
    ],
    fact: 'A knot of three clusters full of colliding, gas-rich spiral galaxies: young clusters still pulling themselves together.' },
  { id: 'shapley', name: 'Shapley Supercluster', type: 'Supercluster', sizeMpc: 80,
    members: [
      { name: 'Abell 3558', l: 312, b: 30.7, distMpc: 200, radiusMpc: 2.5, share: 0.3 },
      { name: 'Abell 3562', l: 313.3, b: 30.4, distMpc: 205, radiusMpc: 1.5, share: 0.12 },
      { name: 'Abell 3556', l: 308.3, b: 31.4, distMpc: 200, radiusMpc: 1.2, share: 0.1 },
      { name: 'Abell 3571', l: 316.3, b: 28.6, distMpc: 160, radiusMpc: 2, share: 0.15 },
      { name: 'Abell 3528', l: 303.9, b: 33, distMpc: 215, radiusMpc: 1.6, share: 0.12 },
    ],
    fact: 'The most massive concentration of galaxies in our cosmic neighborhood, about 650 million light-years away. Laniakea and the Great Attractor are themselves being pulled toward it.' },
  { id: 'horologium-reticulum', name: 'Horologium–Reticulum Supercluster', type: 'Supercluster', sizeMpc: 180,
    members: [
      { name: 'Abell 3266', l: 272.1, b: -40.2, distMpc: 250, radiusMpc: 2.5, share: 0.3 },
      { name: 'Abell 3158', l: 265, b: -48.9, distMpc: 250, radiusMpc: 1.6, share: 0.15 },
      { name: 'Abell 3223', l: 264, b: -46, distMpc: 260, radiusMpc: 1.4, share: 0.12 },
      { name: 'Abell 3112', l: 252.9, b: -56.1, distMpc: 320, radiusMpc: 1.6, share: 0.12 },
    ],
    fact: 'One of the largest superclusters known, roughly 550 million light-years across. Its true extent is still being mapped.' },
];

/** Share-weighted center of a supercluster's members, in Mpc (scene frame), and each member relative to it. */
export function superclusterLayout(s: Supercluster) {
  const pts = s.members.map((m) => galDir(m.l, m.b).multiplyScalar(m.distMpc));
  const total = s.members.reduce((a, m) => a + m.share, 0);
  const c = pts.reduce((acc, p, i) => acc.addScaledVector(p, s.members[i].share / total), new Vector3());
  return { center: c.toArray(), offsets: pts.map((p) => p.sub(c).toArray()) };
}

/**
 * Black holes you can fly up to. Galaxy-centered ones sit at their host galaxy's position; the others
 * have their own (RA hours, Dec degrees, distance in pc). Event-horizon radius = 2.95 km per solar mass.
 */
export interface Companion {
  name: string;
  /** Star radius (Suns), orbit radius (AU), period (days), surface temperature (K). */
  radiusSun: number; distAU: number; periodDays: number; tempK: number;
  /** A stream of gas pulled off the star into the black hole's disk. */
  stream?: boolean;
}
export interface BlackHoleInfo {
  id: string; name: string; type: string; solarMasses: number;
  host?: string; ra?: number; dec?: number; distPc?: number;
  /** Disk brightness: 0 = dormant (just the bent light around the shadow), 1 = typical, above 1 = quasar. */
  disk: number;
  /** Disk temperature scale (K at the brightest ring; small holes' disks are far hotter), outer radius (rs). */
  temp?: number; rOut?: number;
  /** Relativistic jets along the spin axis (relative strength). */
  jet?: number;
  companion?: Companion;
  /** Crowded surroundings: a globular cluster's packed stars all around. */
  sky?: 'globular';
  /** Marked out to this zoom (log10 m) when not set by a host galaxy. */
  markTo?: number;
  fact: string;
}
export const BLACK_HOLES: BlackHoleInfo[] = [
  { id: 'm87-bh', name: 'M87* (black hole)', type: 'Supermassive black hole', solarMasses: 6.5e9, host: 'm87', disk: 1, temp: 5000, rOut: 16, jet: 1,
    fact: 'The first black hole ever photographed, by the Event Horizon Telescope in 2019. At 6.5 billion times the Sun\'s mass, its event horizon is wider than the orbit of Neptune, and its jet stretches 5,000 light-years.' },
  { id: 'm31-bh', name: 'M31* (Andromeda\'s black hole)', type: 'Supermassive black hole', solarMasses: 1.4e8, host: 'andromeda', disk: 0.5, temp: 3800,
    fact: 'About 140 million Suns, some 30 times heavier than the Milky Way\'s, surrounded by an unusual disk of young blue stars.' },
  { id: 'cen-a-bh', name: 'Centaurus A* (black hole)', type: 'Supermassive black hole', solarMasses: 5.5e7, host: 'centaurus-a', disk: 1, temp: 4500, jet: 0.9,
    fact: 'About 55 million Suns. It feeds on gas from a swallowed galaxy and blasts out jets a million light-years long; the Event Horizon Telescope imaged their base in 2021.' },
  { id: 'm81-bh', name: 'M81* (black hole)', type: 'Supermassive black hole', solarMasses: 7e7, host: 'bodes', disk: 0.6, temp: 4000,
    fact: 'About 70 million Suns, feeding slowly: the nearest bright example of a dimly active galactic nucleus, flickering in X-rays and radio.' },
  { id: 'm106-bh', name: 'M106* (black hole)', type: 'Supermassive black hole', solarMasses: 3.9e7, host: 'm106', disk: 0.8, temp: 4500, jet: 0.5,
    fact: 'Weighed with rare precision (39 million Suns) by tracking clumps of water vapor, natural microwave lasers called masers, orbiting in its disk.' },
  { id: 'sombrero-bh', name: 'Sombrero* (black hole)', type: 'Supermassive black hole', solarMasses: 1e9, host: 'sombrero', disk: 0.35, temp: 3500,
    fact: 'About a billion Suns, one of the heaviest black holes in any nearby galaxy, yet it barely feeds and glows only faintly.' },
  { id: 'ngc-4889-bh', name: 'NGC 4889* (black hole)', type: 'Ultramassive black hole', solarMasses: 2.1e10, ra: 13.0023, dec: 27.977, distPc: 9.4e7, disk: 0.2, temp: 3000, markTo: 24,
    fact: 'In the brightest galaxy of the Coma Cluster: about 21 billion Suns, one of the most massive black holes known, now dormant after its feeding days.' },
  { id: 'holmberg-15a-bh', name: 'Holmberg 15A*', type: 'Ultramassive black hole', solarMasses: 4e10, ra: 0.6972, dec: -9.303, distPc: 2.7e8, disk: 0.15, temp: 3000, markTo: 24.5,
    fact: 'About 40 billion Suns, measured from the motions of the stars around it (2019): the heaviest black hole weighed that directly.' },
  { id: '3c-273', name: '3C 273', type: 'Quasar black hole', solarMasses: 8.9e8, ra: 12.4852, dec: 2.0525, distPc: 6.9e8, disk: 1.4, temp: 9000, rOut: 18, jet: 1, markTo: 25.5,
    fact: 'The first quasar ever identified (1963), and the brightest one in our sky. Its black hole, about 900 million Suns, shoots a jet 200,000 light-years long.' },
  { id: 'ton-618', name: 'TON 618', type: 'Ultramassive black hole (quasar)', solarMasses: 6.6e10, ra: 12.4736, dec: 31.4772, distPc: 5.6e9, disk: 1.4, temp: 9000, rOut: 20, markTo: 26,
    fact: 'One of the most massive black holes known, about 66 billion Suns. The gas swirling into it shines brighter than 100 trillion Suns; its light has traveled 10.8 billion years to reach us.' },
  { id: 'cygnus-x1', name: 'Cygnus X-1', type: 'Stellar black hole', solarMasses: 21, ra: 19.9727, dec: 35.2017, distPc: 2220, disk: 1, temp: 25000, rOut: 11, jet: 0.4,
    companion: { name: 'HDE 226868 (blue supergiant)', radiusSun: 22, distAU: 0.2, periodDays: 5.6, tempK: 31000, stream: true },
    fact: 'The first object widely accepted as a black hole (1972): 21 Suns\' worth of collapsed star, pulling gas off the blue supergiant it orbits every 5.6 days.' },
  { id: 'v404-cyg', name: 'V404 Cygni', type: 'Stellar black hole', solarMasses: 9, ra: 20.4011, dec: 33.8672, distPc: 2390, disk: 1, temp: 22000, rOut: 10, jet: 0.5,
    companion: { name: 'V404 Cygni\'s companion (orange giant)', radiusSun: 6, distAU: 0.146, periodDays: 6.47, tempK: 4300, stream: true },
    fact: 'A 9-Sun black hole that erupted in 2015, briefly becoming the brightest X-ray source in the sky. It feeds on a giant star that circles it every 6.5 days.' },
  { id: 'grs-1915', name: 'GRS 1915+105', type: 'Microquasar black hole', solarMasses: 12, ra: 19.2532, dec: 10.9456, distPc: 9400, disk: 1, temp: 28000, rOut: 12, jet: 1,
    companion: { name: 'GRS 1915+105\'s companion (orange giant)', radiusSun: 18, distAU: 0.475, periodDays: 33.9, tempK: 4500, stream: true },
    fact: 'A microquasar spinning near the fastest rate possible. Its jets fly out at over 90% of light speed, and were the first in our galaxy seen to seem to move faster than light (an illusion of perspective).' },
  { id: 'a0620', name: 'A0620-00', type: 'Stellar black hole', solarMasses: 6.6, ra: 6.379, dec: -0.3458, distPc: 1500, disk: 0.25, temp: 15000, rOut: 9,
    companion: { name: 'A0620-00\'s companion (orange dwarf)', radiusSun: 0.75, distAU: 0.0176, periodDays: 0.323, tempK: 4400, stream: true },
    fact: 'One of the nearest known black holes, 6.6 Suns, with an orange dwarf whipping around it every 7.75 hours. It flared brightly in 1975 and has been quiet since.' },
  { id: 'gaia-bh1', name: 'Gaia BH1', type: 'Dormant stellar black hole', solarMasses: 9.6, ra: 17.4781, dec: -0.5811, distPc: 480, disk: 0,
    companion: { name: 'Gaia BH1\'s companion (Sun-like star)', radiusSun: 1, distAU: 1.4, periodDays: 185.6, tempK: 5850 },
    fact: 'The nearest known black hole, about 1,560 light-years away. It\'s dormant: no glowing disk, just a Sun-like star circling it every 186 days.' },
  { id: 'gaia-bh2', name: 'Gaia BH2', type: 'Dormant stellar black hole', solarMasses: 8.9, ra: 13.838, dec: -59.2389, distPc: 1160, disk: 0,
    companion: { name: 'Gaia BH2\'s companion (red giant)', radiusSun: 7.8, distAU: 4.96, periodDays: 1277, tempK: 4600 },
    fact: 'A dormant 8.9-Sun black hole about 3,800 light-years away, circled by a red giant on a 3.5-year orbit.' },
  { id: 'gaia-bh3', name: 'Gaia BH3', type: 'Dormant stellar black hole', solarMasses: 33, ra: 19.6553, dec: 14.9317, distPc: 590, disk: 0,
    companion: { name: 'Gaia BH3\'s companion (old giant)', radiusSun: 4.9, distAU: 16.2, periodDays: 4253, tempK: 5200 },
    fact: 'The heaviest stellar black hole known in the Milky Way, 33 Suns, found in 2024 from the wobble of the old star orbiting it.' },
  { id: 'omega-cen-bh', name: 'Omega Centauri black hole', type: 'Intermediate-mass black hole', solarMasses: 8200, ra: 13.4465, dec: -47.4794, distPc: 5430, disk: 0, sky: 'globular',
    fact: 'At least 8,200 Suns: a rare "in-between" black hole, found in 2024 from seven stars racing through the cluster\'s core too fast to stay bound without it. Its packed cluster of ten million stars surrounds it.' },
];
export const horizonM = (solarMasses: number) => solarMasses * 2953;

export const NORMA = {
  id: 'norma-cluster', name: 'Norma Cluster', type: 'Galaxy cluster (Abell 3627)', l: 325.3, b: -7.26, distMpc: 68, sizeMpc: 4,
  fact: 'A massive cluster of thousands of galaxies near the heart of the Great Attractor, so hidden by the Milky Way\'s dust that it was mapped mostly in X-rays and radio. One of its galaxies, ESO 137-001, trails a tail of stripped gas over 200,000 light-years long as it plunges through the cluster\'s hot gas.',
};

export const OBSERVABLE_UNIVERSE = {
  id: 'observable-universe', name: 'Edge of the observable universe', type: 'Cosmological horizon',
  radiusMpc: 14_250,
  fact: 'Light from here left 13.8 billion years ago, but space has stretched so the edge is now ~46 billion light-years away.',
};

export const COSMIC_WEB = { nearRadiusMpc: 600, nearNodes: 380, farNodes: 550 };
