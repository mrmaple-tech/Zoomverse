// Builds procedural point clouds (galaxies, nebulae, the cosmic web) off the main thread, so generating
// a 160k-star galaxy never stalls a frame. Each request is a list of generator steps into one cloud.
import { cloud, type Cloud } from './cloud.ts';
import { addElliptical, addIrregular, addMerger, addRing, addSpiral, web } from './galaxy.ts';
import { addEmission, addPlanetary, addRemnant } from './nebula.ts';

type Opts = Record<string, number>;
const GEN: Record<string, (c: Cloud, o: Opts) => void> = {
  spiral: (c, o) => addSpiral(c, o as Parameters<typeof addSpiral>[1]),
  elliptical: (c, o) => addElliptical(c, o as Parameters<typeof addElliptical>[1]),
  irregular: (c, o) => addIrregular(c, o as Parameters<typeof addIrregular>[1]),
  ring: (c, o) => addRing(c, o as Parameters<typeof addRing>[1]),
  merger: (c, o) => addMerger(c, o as Parameters<typeof addMerger>[1]),
  emission: (c, o) => addEmission(c, o as Parameters<typeof addEmission>[1]),
  planetary: (c, o) => addPlanetary(c, o as Parameters<typeof addPlanetary>[1]),
  remnant: (c, o) => addRemnant(c, o as Parameters<typeof addRemnant>[1]),
  web: (c, o) => web(c, o.seed, o.nodes, o.rMin, o.rMax, o.scatter, o.perLink, o.perNode),
};

self.onmessage = ({ data: { id, steps } }: MessageEvent<{ id: number; steps: { gen: string; opts: Opts }[] }>) => {
  const c = cloud();
  for (const s of steps) GEN[s.gen](c, s.opts);
  const a = c.arrays();
  (self as unknown as Worker).postMessage({ id, ...a }, [a.position.buffer, a.color.buffer, a.size.buffer, a.aSpeed.buffer]);
};
