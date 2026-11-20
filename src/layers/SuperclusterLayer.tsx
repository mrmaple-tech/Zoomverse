// Superclusters (Mpc space) you can fly into: their member clusters at real positions, the filaments
// joining them, field galaxies, and for Laniakea the flow of galaxies toward its heart.
import { useMemo } from 'react';
import { useStore } from '../store.ts';
import { SUPERCLUSTERS, superclusterLayout, type Supercluster } from '../data/deepSky.ts';
import type { Fade } from '../data/layers.ts';
import { galDir } from '../lib/coords.ts';
import { Inspectable } from '../scene/Inspectable.tsx';
import { Label } from '../scene/Label.tsx';
import type { CloudStep } from '../scene/useCloud.ts';
import { Flow } from './AttractorLayer.tsx';

const SHOWN: Fade = [23.4, 24.0, 26.2, 26.8];
const LABEL: Fade = [24.0, 24.4, 25.6, 26.2];

function SuperclusterView({ s, seed }: { s: Supercluster; seed: number }) {
  const { center, offsets } = useMemo(() => superclusterLayout(s, galDir), [s]);
  const R = s.sizeMpc / 2;
  const recipe = (count: number, bright: number): CloudStep[] => [{
    gen: 'supercluster',
    opts: { count, radius: R, seed, bright, clusters: s.members.flatMap((m, i) => [...offsets[i], m.radiusMpc, m.share]) },
  }];
  // member names appear while you're at this supercluster
  const here = () => { const st = useStore.getState(); return st.focusId === s.id || st.flight?.to === s.id; };
  const inside: Fade = [-Infinity, -Infinity, Math.log10(s.sizeMpc * 3.086e22 * 1.6), Math.log10(s.sizeMpc * 3.086e22 * 3)];
  return (
    <Inspectable
      id={s.id} name={s.name} window={SHOWN} label={LABEL} position={center}
      coarse={recipe(7000, 1.6)} fine={recipe(160_000, 0.55)} size={[s.sizeMpc * 0.005, s.sizeMpc * 0.0018]}
      glow={{ size: R * 0.8, color: '#b9a8ff', opacity: 0.3 }}
    >
      {s.flow && <Flow radius={R * 0.9} position={offsets[0]} count={7000} seed={seed} />}
      {s.members.map((m, i) => <Label key={m.name} id={s.id} text={m.name} position={offsets[i]} window={inside} variant="faint" shown={here} />)}
    </Inspectable>
  );
}

export function SuperclusterLayer() {
  return <>{SUPERCLUSTERS.map((s, i) => <SuperclusterView key={s.id} s={s} seed={90 + i} />)}</>;
}
