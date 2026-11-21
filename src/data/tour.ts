// Guided tours: the autopilot flies to each stop, shows its caption, lingers, then moves on.
import { STARS } from './stars.ts';

export interface TourStop {
  focus: string;
  /** Zoom (log10 m); defaults to the focus object's own view. */
  logD?: number;
  /** Camera direction as galactic [l, b] degrees, for the galaxy-scale stops. */
  viewGal?: [number, number];
  title: string;
  text: string;
  /** Seconds to linger after arriving. */
  hold: number;
}

const star = (name: string) => `star-${STARS.findIndex((s) => s[0] === name)}`;

/** A flight from Earth to the edge of the observable universe and back. */
const UNIVERSE: TourStop[] = [
  { focus: 'earth', logD: 7.55, title: 'Home', hold: 6,
    text: 'Everyone you have ever known lives on this sphere, 12,742 km across, lit right now by the real Sun.' },
  { focus: 'moon', title: 'The Moon', hold: 6,
    text: 'Our companion is 384,400 km away. Light makes the trip in 1.3 seconds; Apollo took three days.' },
  { focus: 'sun', logD: 11.65, title: 'The inner solar system', hold: 6,
    text: 'Mercury, Venus, Earth and Mars: the rocky planets, all huddled within 1.5 AU of the Sun.' },
  { focus: 'saturn', title: 'Saturn', hold: 6,
    text: 'A gas giant nine times wider than Earth, with rings 280,000 km across but only about 10 m thick.' },
  { focus: 'sun', logD: 13.05, title: 'The outer planets', hold: 6,
    text: 'Neptune orbits 30 times farther out than Earth. Sunlight takes four hours to reach it.' },
  { focus: 'sun', logD: 14.2, title: 'The edge of the Sun\'s influence', hold: 6,
    text: 'The heliopause, where the solar wind gives way to interstellar space. Both Voyagers have crossed it.' },
  { focus: 'sun', logD: 17.4, title: 'Our stellar neighbors', hold: 7,
    text: 'The nearest star, Proxima Centauri, is 4.2 light-years away. Voyager 1 would need 73,000 years to get there.' },
  { focus: 'milky-way', logD: 21.05, viewGal: [180, 50], title: 'The Milky Way', hold: 7,
    text: 'Our galaxy: a few hundred billion stars in a disk 100,000 light-years wide. We orbit its center every 230 million years.' },
  { focus: 'sgr-a', title: 'The black hole at the center', hold: 9,
    text: 'Sagittarius A*: four million Suns of mass in a space smaller than Mercury\'s orbit. Its gravity bends light, so the far side of its glowing disk appears wrapped over the top.' },
  { focus: 'local-group', logD: 22.75, viewGal: [150, 35], title: 'The Local Group', hold: 7,
    text: 'Andromeda, 2.5 million light-years away, is falling toward us. The two galaxies will merge in about 4.5 billion years.' },
  { focus: 'milky-way', logD: 25.2, title: 'The cosmic web', hold: 7,
    text: 'Galaxies gather along vast filaments around empty voids. Every speck here is a galaxy.' },
  { focus: 'observable-universe', title: 'The edge of what we can see', hold: 8,
    text: 'Light from here has traveled 13.8 billion years to reach us. Beyond it, the universe goes on, unseen.' },
  { focus: 'earth', logD: 7.55, title: 'You are here', hold: 6,
    text: 'And back to one pale blue dot. Scroll, search or tap anything to explore on your own.' },
];

/** From a cloud of gas to a black hole: the two paths a star's life can take. */
const STAR_LIFE: TourStop[] = [
  { focus: 'orion-nebula', title: 'Born in a cloud', hold: 8,
    text: 'Stars form inside clouds of gas and dust like the Orion Nebula. Gravity pulls clumps together until their cores grow hot enough to fuse hydrogen, and a star switches on.' },
  { focus: 'sun', title: 'A long, steady life', hold: 7,
    text: 'For most of its life a star fuses hydrogen into helium in its core. The Sun is about halfway through this stage: 4.6 billion years down, about 5 billion to go.' },
  { focus: star('Aldebaran'), title: 'A red giant', hold: 8,
    text: 'When the hydrogen in its core runs out, a Sun-like star swells into a red giant like Aldebaran, 44 times wider than the Sun. Its surface cools to orange-red.' },
  { focus: 'ring-nebula', title: 'Letting go', hold: 8,
    text: 'In its last stage the giant puffs its outer layers into space, making a glowing shell called a planetary nebula, like the Ring Nebula. (Despite the name, it has nothing to do with planets.)' },
  { focus: star('Gl 244B'), title: 'A white dwarf', hold: 8,
    text: 'What remains is the star\'s hot core: a white dwarf, about the size of Earth but as heavy as the Sun. This one is Sirius B. It will cool and fade over trillions of years.' },
  { focus: star('Rigel'), title: 'The other path: massive stars', hold: 8,
    text: 'Stars more than about eight times the Sun\'s mass live fast. Rigel, a blue supergiant, burns so fiercely it will last only around 10 million years, a thousandth of the Sun\'s life.' },
  { focus: star('Betelgeuse'), title: 'A red supergiant', hold: 8,
    text: 'Late in life a massive star balloons into a red supergiant. Put in the Sun\'s place, Betelgeuse would reach out past the asteroid belt. Its core is building heavier and heavier elements, up to iron.' },
  { focus: 'crab-nebula', title: 'Supernova', hold: 9,
    text: 'Iron can\'t be fused for energy, so the core collapses in under a second and the star explodes. The Crab Nebula is the wreck of one seen in 1054. At its heart spins a neutron star, a city-sized ball heavier than the Sun.' },
  { focus: 'cygnus-x1', title: 'A black hole', hold: 10,
    text: 'The heaviest cores collapse further still, into black holes. Cygnus X-1 is 21 Suns of collapsed star, pulling gas off its companion. The gold in your jewelry was forged in explosions and collisions like these.' },
];

/** How astronomers went from zero known exoplanets to thousands. */
const EXOPLANETS: TourStop[] = [
  { focus: 'earth', logD: 7.55, title: 'Are there other worlds?', hold: 7,
    text: 'Until the 1990s no one knew whether other stars had planets. Planets are tiny and dim next to their stars, so astronomers had to find clever, indirect ways to spot them.' },
  { focus: 'exo-saffar', title: 'The wobble method', hold: 9,
    text: 'A planet tugs its star in a little circle, so the star\'s light shifts slightly bluer and redder as it wobbles. The first planets found around Sun-like stars, in 1995 and 1996, were "hot Jupiters" like Saffar: giants hugging their stars, which made the wobble big.' },
  { focus: star('Titawin'), title: 'Whole systems', hold: 8,
    text: 'In 1999 Upsilon Andromedae became the first Sun-like star found to have several planets. Our solar system was no longer the only one we knew.' },
  { focus: 'exo-proxima-b', title: 'Small, close worlds', hold: 8,
    text: 'Better instruments caught smaller wobbles. In 2016 they found Proxima b, an Earth-mass planet around the nearest star, in the zone where liquid water could exist.' },
  { focus: star('TRAPPIST-1'), title: 'The transit method', hold: 9,
    text: 'When a planet crosses in front of its star, the star dims a little. Watching for those dips found TRAPPIST-1\'s seven Earth-sized worlds, and the Kepler and TESS telescopes found thousands more this way.' },
  { focus: 'exo-trappist-1e', title: 'Could it hold water?', hold: 8,
    text: 'TRAPPIST-1e is about Earth\'s size and in its star\'s habitable zone. The James Webb Space Telescope now studies starlight passing through such planets\' air, looking for its fingerprints.' },
  { focus: 'exo-janssen', title: 'Weighing up atmospheres', hold: 8,
    text: 'Webb also measures the heat glowing from planets as they slip behind their stars. In 2024 it found signs that Janssen, a lava world, has an atmosphere.' },
  { focus: 'exo-kepler-1625-b-i', title: 'The hunt for exomoons', hold: 8,
    text: 'Moons around exoplanets are the next frontier. Kepler-1625 b-i, a possible Neptune-sized moon, was spotted as an extra dip in its planet\'s transit. It still isn\'t confirmed.' },
  { focus: 'earth', logD: 7.55, title: 'More than 6,000 worlds', hold: 7,
    text: 'Today we know of more than 6,000 planets around other stars, and the count keeps climbing. Most stars have planets. Whether any of them hold life is one of the biggest open questions.' },
];

/** From the largest stars to the largest structures, and the edge of all we can see. */
const BIGGEST: TourStop[] = [
  { focus: star('Antares'), title: 'A giant star', hold: 8,
    text: 'Antares is one of the biggest stars we can see, about 700 times wider than the Sun. Put it where the Sun is and its surface would reach past Mars.' },
  { focus: 'ton-618', title: 'A giant black hole', hold: 9,
    text: 'TON 618 weighs about 66 billion Suns. Its event horizon alone is about 40 times wider than Neptune\'s orbit around the Sun.' },
  { focus: 'carina-nebula', title: 'A giant nebula', hold: 8,
    text: 'The Carina Nebula stretches about 300 light-years across, one of the largest star-forming clouds in our galaxy.' },
  { focus: 'm87', title: 'A giant galaxy', hold: 8,
    text: 'M87 holds around a trillion stars, several times as many as the Milky Way, in a ball some 130,000 light-years across.' },
  { focus: 'norma-cluster', title: 'A cluster of galaxies', hold: 8,
    text: 'Galaxies gather in clusters held together by gravity. The Norma Cluster contains thousands of them, wrapped in gas heated to tens of millions of degrees.' },
  { focus: 'laniakea', title: 'Our supercluster', hold: 9,
    text: 'Clusters, in turn, belong to superclusters. Laniakea, our home, spans about 520 million light-years and holds some 100,000 galaxies, all flowing toward the Great Attractor.' },
  { focus: 'shapley', title: 'The heaviest thing nearby', hold: 8,
    text: 'The Shapley Supercluster is the most massive concentration of galaxies in our part of the universe, about 650 million light-years away.' },
  { focus: 'milky-way', logD: 25.2, title: 'The cosmic web', hold: 8,
    text: 'On the largest scales, superclusters link into a web of filaments wrapped around enormous empty voids. It is the biggest structure there is.' },
  { focus: 'observable-universe', title: 'Everything we can see', hold: 9,
    text: 'The observable universe is about 93 billion light-years across. Beyond it, light hasn\'t had time to reach us yet, and the universe very likely goes on.' },
];

export interface Tour { id: string; name: string; blurb: string; stops: TourStop[] }
export const TOURS: Tour[] = [
  { id: 'universe', name: 'Earth to the edge', blurb: 'From home to the edge of the observable universe', stops: UNIVERSE },
  { id: 'star-life', name: 'Life of a star', blurb: 'Nebula, star, giant, white dwarf, supernova, black hole', stops: STAR_LIFE },
  { id: 'exoplanets', name: 'How we found exoplanets', blurb: 'Wobbles, transits and the hunt for other worlds', stops: EXOPLANETS },
  { id: 'biggest', name: 'The biggest things', blurb: 'From giant stars to the cosmic web', stops: BIGGEST },
];
export const tourById = (id: string) => TOURS.find((t) => t.id === id)!;
