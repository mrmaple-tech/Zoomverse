// Time-lapses: simulated futures with their own clock, from t = 0 (now) to t = 1 (the end).
export type EventId = 'merger' | 'supernova' | 'red-giant';

export interface Phase { at: number; title: string; text: string }
export interface TimeLapse {
  id: EventId;
  name: string;
  blurb: string;
  /** Real seconds the whole time-lapse takes to play. */
  seconds: number;
  phases: Phase[];
  /** The time-lapse clock at t, as words. */
  clock: (t: number) => string;
}

const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const gyr = (n: number) => `${n < 0.05 ? 'Now' : `${n.toFixed(n < 7.5 ? 1 : 2)} billion years from now`}`;

/** Merger: t spans 7 billion years. */
export const mergerGyr = (t: number) => t * 7;

/** Supernova: before 0.25 the star's last stretch; after, years since the explosion on a log scale (to ~20,000). */
export const SN_BANG = 0.25;
export const snYears = (t: number) => (t < SN_BANG ? 0 : 10 ** (((t - SN_BANG) / (1 - SN_BANG)) * 4.3) - 1);
/** Radius of the debris shell (pc): free expansion at ~10,000 km/s, then slowing as it sweeps up gas. */
export const snShellPc = (years: number) => (years < 200 ? 0.0102 * years : 2.04 * (years / 200) ** 0.4);

/** The Sun's future (from stellar evolution models, rounded): t, billions of years from now, radius (Suns), surface temperature (K). */
const SUN: [number, number, number, number][] = [
  [0, 0, 1, 5772], [0.15, 1.1, 1.1, 5820], [0.3, 4.8, 1.6, 5600], [0.4, 6.5, 2.4, 4900], [0.47, 7.45, 60, 3300], [0.52, 7.58, 200, 2900], [0.56, 7.59, 200, 2900],
  [0.62, 7.6, 10, 4800], [0.72, 7.7, 12, 4700], [0.82, 7.72, 160, 3000], [0.86, 7.73, 120, 3300], [0.9, 7.731, 0.05, 60000], [1, 7.75, 0.013, 30000],
];
/** Age (Gyr from now), radius (Suns) and temperature (K) of the Sun at t; radius interpolated in log space. */
export function sunAt(t: number) {
  let i = 0;
  while (i < SUN.length - 2 && t > SUN[i + 1][0]) i++;
  const [t0, a0, r0, k0] = SUN[i], [t1, a1, r1, k1] = SUN[i + 1], f = smooth(t0, t1, t);
  return { gyr: a0 + (a1 - a0) * f, radius: Math.exp(Math.log(r0) + (Math.log(r1) - Math.log(r0)) * f), temp: k0 + (k1 - k0) * f };
}
/** The planetary nebula (AU), from when the envelope lets go. */
export const pnRadiusAU = (t: number) => (t < 0.85 ? 0 : 1 + 2000 * ((t - 0.85) / 0.15) ** 2.2);
/** The red giant's biggest size so far (AU): planets it swallowed stay gone after it shrinks. */
export const sunReachAU = (t: number) => (t >= 0.52 ? 200 : sunAt(t).radius) * (6.957e8 / 1.495978707e11);

export const EVENTS: TimeLapse[] = [
  {
    id: 'merger', name: 'Milky Way meets Andromeda', blurb: 'Two galaxies collide over 7 billion years', seconds: 60,
    clock: (t) => gyr(mergerGyr(t)),
    phases: [
      { at: 0, title: 'Today', text: 'Andromeda is 2.5 million light-years away and closing at about 110 km/s. The two biggest galaxies in the Local Group are falling toward each other.' },
      { at: 0.35, title: 'Closing in', text: 'Over billions of years Andromeda grows until it fills the night sky of any planet in the Milky Way.' },
      { at: 0.58, title: 'The first pass', text: 'The galaxies swoop through each other. Their stars almost never collide, because the gaps between them are so vast, but gravity flings out long tails of stars.' },
      { at: 0.7, title: 'Falling back', text: 'The galaxies swing apart, slow down, and fall back together for a second, closer pass.' },
      { at: 0.82, title: 'Merging', text: 'Their cores spiral together. Gas squeezed in the collision lights up bursts of new stars, and the two central black holes will eventually merge too.' },
      { at: 0.93, title: 'Milkomeda', text: 'The two have become one giant elliptical galaxy, nicknamed Milkomeda. The Sun would likely survive, flung onto a new orbit. This is the classic forecast; a 2025 study found it closer to a coin flip whether they merge within 10 billion years.' },
    ],
  },
  {
    id: 'supernova', name: 'Betelgeuse goes supernova', blurb: 'A red supergiant explodes', seconds: 50,
    clock: (t) => {
      if (t < SN_BANG * 0.85) return 'Some time in the next 100,000 years';
      if (t < SN_BANG) return 'The final second';
      const y = snYears(t);
      return y < 1 ? `${Math.max(1, Math.round(y * 365))} days after the explosion` : `${Math.round(y).toLocaleString()} years after the explosion`;
    },
    phases: [
      { at: 0, title: 'A star at its limit', text: 'Betelgeuse, the red supergiant in Orion\'s shoulder, is near the end of its life. It will explode some time in the next 100,000 years; no one knows when.' },
      { at: 0.1, title: 'Pulsing', text: 'Its huge outer layers swell and shrink over months and years. In 2019–20 a cloud of dust it puffed out made it dim dramatically.' },
      { at: 0.2, title: 'Core collapse', text: 'Its iron core, as heavy as the Sun, can no longer hold itself up. In under a second it collapses into a neutron star about 20 km wide, and the rebound blasts the star apart.' },
      { at: 0.26, title: 'Supernova', text: 'For a few months Betelgeuse would shine about as bright as the half Moon, easily visible in daylight, then fade over a year or two. At this distance it poses no danger to Earth.' },
      { at: 0.5, title: 'The blast wave', text: 'The debris races outward at about 10,000 km/s, carrying newly made elements such as oxygen, silicon and iron into space.' },
      { at: 0.75, title: 'A supernova remnant', text: 'Over thousands of years the shell slows as it sweeps up gas, glowing like the Crab Nebula does today. Its elements will seed future stars and planets.' },
    ],
  },
  {
    id: 'red-giant', name: 'The Sun becomes a red giant', blurb: 'The Sun\'s next 8 billion years', seconds: 55,
    clock: (t) => gyr(sunAt(t).gyr),
    phases: [
      { at: 0, title: 'Today', text: 'The Sun is a middle-aged star, steadily fusing hydrogen into helium in its core.' },
      { at: 0.1, title: 'Getting brighter', text: 'The Sun slowly brightens, about 10% every billion years. In roughly a billion years Earth grows too hot to keep its oceans.' },
      { at: 0.3, title: 'Out of hydrogen', text: 'In about 5 billion years the hydrogen in the core runs out. The core shrinks and heats up while the outer layers begin to swell.' },
      { at: 0.45, title: 'A red giant', text: 'The Sun balloons to about 200 times its width and cools to a deep orange-red. It swallows Mercury, then Venus. Earth\'s fate is uncertain: it may be engulfed, or survive as a scorched rock.' },
      { at: 0.57, title: 'Helium flash', text: 'The core gets hot enough to fuse helium, igniting in a sudden flash. The Sun shrinks back to about 10 times its present size for some 100 million years.' },
      { at: 0.75, title: 'A giant again', text: 'As its helium runs low the Sun swells once more, shedding its outer layers in strong winds.' },
      { at: 0.85, title: 'A planetary nebula', text: 'The outer layers drift off into a glowing shell, lit by the exposed core.' },
      { at: 0.92, title: 'A white dwarf', text: 'Left behind is a white dwarf: the Sun\'s core, about the size of Earth, cooling and fading over trillions of years.' },
    ],
  },
];
export const eventById = (id: EventId) => EVENTS.find((e) => e.id === id)!;
export const phaseAt = (e: TimeLapse, t: number) => [...e.phases].reverse().find((p) => t >= p.at) ?? e.phases[0];
