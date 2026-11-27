// Builds procedural point clouds (galaxies, nebulae, the cosmic web) off the main thread, so generating
// a 160k-star galaxy never stalls a frame. Each request is a list of generator steps into one cloud.
import { cloud, type Cloud } from './cloud.ts';
import { addCluster, addElliptical, addIrregular, addMerger, addRing, addSpiral, addSupercluster, web } from './galaxy.ts';
import { addEmission, addPlanetary, addRemnant } from './nebula.ts';

type Opts = Record<string, number | number[]>;
// each generator reads its own option shape; the recipe came from our own layer code
const GEN = { spiral: addSpiral, elliptical: addElliptical, irregular: addIrregular, ring: addRing, merger: addMerger, emission: addEmission,
  planetary: addPlanetary, remnant: addRemnant, cluster: addCluster, supercluster: addSupercluster,
  web: (c: Cloud, n: Record<string, number>) => web(c, n.seed, n.nodes, n.rMin, n.rMax, n.scatter, n.perLink, n.perNode),
} as unknown as Record<string, (c: Cloud, o: Opts) => void>;

self.onmessage = ({ data: { id, steps } }: MessageEvent<{ id: number; steps: { gen: string; opts: Opts }[] }>) => {
  const c = cloud();
  for (const s of steps) GEN[s.gen](c, s.opts);
  const a = c.arrays();
  (self as unknown as Worker).postMessage({ id, ...a }, [a.position.buffer, a.color.buffer, a.size.buffer, a.aSpeed.buffer]);
};
