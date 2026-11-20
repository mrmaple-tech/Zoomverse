import { useMemo } from 'react';
import { COSMIC_WEB as W, OBSERVABLE_UNIVERSE as OU, STRUCTURES } from '../data/deepSky.ts';
import { LAYERS } from '../data/layers.ts';
import { galDir } from '../lib/coords.ts';
import { shellMaterial } from '../scene/materials.ts';
import { Label } from '../scene/Label.tsx';
import { Fader } from '../scene/Space.tsx';
import { PointCloud } from '../scene/PointCloud.tsx';
import { useCloud, type CloudStep } from '../scene/useCloud.ts';

const LAYER = LAYERS[7];
const EDGE_FADE = [25.3, 26.1, Infinity, Infinity] as const;
const NEAR: CloudStep[] = [{ gen: 'web', opts: { seed: 5, nodes: W.nearNodes, rMin: 0, rMax: W.nearRadiusMpc, scatter: 5, perLink: 22, perNode: 25 } }];
// ponytail: the far field reuses the same generator at a coarser scale; real filaments don't grow with distance
const FAR: CloudStep[] = [{ gen: 'web', opts: { seed: 6, nodes: W.farNodes, rMin: W.nearRadiusMpc, rMax: OU.radiusMpc, scatter: 110, perLink: 14, perNode: 12 } }];

export function CosmicWebLayer() {
  const near = useCloud(NEAR), far = useCloud(FAR);
  const edge = useMemo(() => shellMaterial('#c08bff', 0.35), []);
  return (
    <Fader window={LAYER.fade}>
      {/* World-sized points: distant ones drop to faint single pixels instead of overdrawing the screen. */}
      {near && <PointCloud geometry={near} worldSize={1} />}
      {far && <PointCloud geometry={far} worldSize={9} />}
      {STRUCTURES.filter((s) => s.id !== 'great-attractor').map((s) => ( // the Great Attractor labels itself
        <Label key={s.id} id={s.id} text={s.name} window={s.distMpc > 150 ? [24.3, 24.8, 26, 26.6] : s.distMpc < 50 ? [23.4, 23.8, 24.8, 25.15] : [23.6, 24.0, 25.4, 26]} position={galDir(s.l, s.b).multiplyScalar(s.distMpc).toArray()} />
      ))}
      <Fader window={EDGE_FADE}>
        <mesh scale={OU.radiusMpc} material={edge}><sphereGeometry args={[1, 64, 32]} /></mesh>
        <Label id={OU.id} text="Edge of the observable universe" variant="faint" window={EDGE_FADE} position={galDir(30, 50).multiplyScalar(OU.radiusMpc).toArray()} />
      </Fader>
    </Fader>
  );
}
