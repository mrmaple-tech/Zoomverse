import { useMemo } from 'react';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { NEBULAE, type Nebula } from '../data/deepSky.ts';
import type { Fade } from '../data/layers.ts';
import { radecDir } from '../lib/coords.ts';
import { Inspectable } from '../scene/Inspectable.tsx';
import type { CloudStep } from '../scene/useCloud.ts';

/** Famous nebulae in the Milky Way (parsec space). Each stays shown while focused. */
const SHOWN: Fade = [16.8, 17.6, 20.6, 21.3];
const LABEL: Fade = [17.8, 18.3, 19.8, 20.4];
const UP = new Vector3(0, 1, 0);

const recipe = (n: Nebula, seed: number, count: number, bright: number): CloudStep[] =>
  [{ gen: n.shape, opts: { radius: n.sizePc / 2, seed, count, bright, ...n.opts } }];

function NebulaView({ n, seed }: { n: Nebula; seed: number }) {
  const { pos, quat } = useMemo(() => {
    const dir = radecDir(n.ra, n.dec);
    // face Earth, with the nebula's own "up" toward the top of the screen
    const z = dir.clone().negate(), x = new Vector3().crossVectors(UP, z).normalize(), y = new Vector3().crossVectors(z, x);
    return { pos: dir.clone().multiplyScalar(n.distPc).toArray(), quat: new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z)) };
  }, [n]);
  return (
    <Inspectable
      id={n.id} name={n.name} window={SHOWN} label={LABEL} position={pos} quaternion={quat}
      coarse={recipe(n, seed, 4000, 2.5)}
      fine={recipe(n, seed, n.shape === 'emission' ? 140_000 : 90_000, 1)}
      size={[n.sizePc * 0.012, n.sizePc * 0.004]}
      glow={{ size: n.sizePc * 1.2, color: n.shape === 'planetary' ? '#7fe0e0' : n.shape !== 'starcluster' ? '#ff7a9a' : n.opts?.globular ? '#ffe2bd' : '#9fc0ff' }}
    />
  );
}

export function NebulaLayer() {
  return <>{NEBULAE.map((n, i) => <NebulaView key={n.id} n={n} seed={50 + i} />)}</>;
}
