export interface Galaxy {
  id: string;
  name: string;
  type: string;
  /** Galactic longitude/latitude (deg) and distance (kpc) from the Sun. */
  l: number; b: number; distKpc: number;
  diameterKpc: number;
  shape: 'spiral' | 'irregular' | 'elliptical';
  /** Disk inclination to our line of sight (0 = face-on, 90 = edge-on) and its position angle, degrees. */
  incl: number; pa: number;
  /** Extra generator options (arms, pitch, bulge, dust lane, jet…), see scene/galaxy.ts. */
  opts?: Record<string, number>;
  /** Which zoom range labels it: Local Group giants, the Magellanic Clouds, Andromeda's moons, or beyond. */
  zone: 'local' | 'mc' | 'm31' | 'far';
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
