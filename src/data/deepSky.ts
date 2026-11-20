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
  fact: 'Four million Suns of mass, at the center of our galaxy. Its gravity bends light: the far side of its glowing disk appears arched over the top and bottom of its shadow, and the side spinning toward you shines brightest. Gas at the inner edge circles at half the speed of light, once every 30 minutes (sped up here).',
};

export const GALAXIES: Galaxy[] = [
  { id: 'andromeda', name: 'Andromeda (M31)', type: 'Spiral galaxy', l: 121.17, b: -21.57, distKpc: 765, diameterKpc: 46, shape: 'spiral', incl: 77, pa: 38,
    opts: { arms: 2, pitchDeg: 9, bulge: 0.14 }, zone: 'local',
    fact: 'Andromeda is heading toward us at ~110 km/s and will merge with the Milky Way in about 4.5 billion years.' },
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
    fact: 'Six supernovae have been spotted in it in the last century, among the most of any galaxy.' },
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
  { id: 'great-attractor', name: 'Great Attractor', type: 'Gravitational anomaly', l: 307.8, b: 9.3, distMpc: 75, sizeMpc: 50,
    fact: 'Hidden behind the Milky Way\'s disk, it tugs on galaxies across hundreds of millions of light-years.' },
  { id: 'coma-cluster', name: 'Coma Cluster', type: 'Galaxy cluster', l: 58.1, b: 87.96, distMpc: 99, sizeMpc: 6,
    fact: 'Fritz Zwicky first inferred dark matter in 1933 from how fast its galaxies move.' },
  { id: 'shapley', name: 'Shapley Supercluster', type: 'Supercluster', l: 312, b: 31, distMpc: 200, sizeMpc: 80,
    fact: 'The most massive concentration of galaxies in our cosmic neighborhood.' },
  { id: 'bootes-void', name: 'Boötes Void', type: 'Cosmic void', l: 80, b: 60, distMpc: 210, sizeMpc: 100,
    fact: 'A near-empty sphere ~330 million light-years across with only about 60 galaxies.' },
];

export const OBSERVABLE_UNIVERSE = {
  id: 'observable-universe', name: 'Edge of the observable universe', type: 'Cosmological horizon',
  radiusMpc: 14_250,
  fact: 'Light from here left 13.8 billion years ago, but space has stretched so the edge is now ~46 billion light-years away.',
};

export const COSMIC_WEB = { nearRadiusMpc: 600, nearNodes: 380, farNodes: 550 };
