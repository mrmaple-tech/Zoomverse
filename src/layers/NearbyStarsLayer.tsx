import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { STARS, FAMOUS_STARS } from '../data/stars.ts';
import { LAYERS } from '../data/layers.ts';
import { PC, eqjToScene } from '../lib/coords.ts';
import { get } from '../catalog.ts';
import { starColor, starTemp } from '../lib/stars.ts';
import { selectOnClick, useStore } from '../store.ts';
import { starSurface } from '../scene/materials.ts';
import { Glow } from '../scene/Glow.tsx';
import { visitedStar } from './ExoplanetLayer.tsx';
import { Label } from '../scene/Label.tsx';
import { Fader } from '../scene/Space.tsx';
import { PointCloud, cloud } from '../scene/PointCloud.tsx';

const LAYER = LAYERS[4];
const FAR_LABEL = [16.3, 17.2, 19.6, 20.4] as const; // distant giants stay labeled a little longer

export function NearbyStarsLayer() {
  const { geometry, labels } = useMemo(() => {
    const c = cloud();
    const labels: { id: string; name: string; p: [number, number, number]; far: boolean }[] = [];
    STARS.forEach(([name, x, y, z, , absmag, bv], i) => {
      const p = eqjToScene(x, y, z);
      const [r, g, b] = starColor(starTemp(bv));
      // brighter stars: bigger and pushed past 1.0 so bloom picks them up
      const boost = Math.min(2.2, Math.max(0.35, 1.25 - absmag * 0.09));
      c.push(p.x, p.y, p.z, r * boost, g * boost, b * boost, Math.min(13, Math.max(2.2, 8 - absmag * 0.55)));
      // Proxima sits beside Rigil Kentaurus on screen; it stays searchable but unlabeled
      if (name in FAMOUS_STARS && name !== 'Proxima Centauri') labels.push({ id: `star-${i}`, name, p: p.toArray(), far: p.length() > 50 });
    });
    return { geometry: c.build(), labels };
  }, []);

  return (
    <>
      <Fader window={LAYER.fade}>
        <PointCloud geometry={geometry} onPick={(i) => useStore.getState().select(`star-${i}`)} />
        {labels.map((l) => <Label key={l.id} id={l.id} text={l.name} position={l.p} window={l.far ? FAR_LABEL : LAYER.fade} />)}
      </Fader>
      <FocusedStar />
    </>
  );
}

/** The star you're focused on (or flying to), drawn as a real glowing sphere you can fly right up to. */
function FocusedStar() {
  // also the host star while you're visiting one of its planets
  const id = useStore((s) => {
    const f = s.flight?.to ?? s.focusId;
    return f?.startsWith('star-') ? f : visitedStar(f);
  });
  return id ? <StarBody key={id} id={id} /> : null;
}

function StarBody({ id }: { id: string }) {
  const ref = useRef<Group>(null!);
  const { pos, radius, material, color } = useMemo(() => {
    const [, x, y, z, , , bv] = STARS[+id.slice(5)];
    const look = starSurface(starTemp(bv), get(id).radiusM! / 6.957e8, starColor);
    return { pos: eqjToScene(x, y, z).toArray(), radius: get(id).radiusM! / PC, material: look.material, color: look.glow };
  }, [id]);
  useFrame(() => {
    const { logD, readable } = useStore.getState();
    ref.current.visible = logD < 15.4; // sub-pixel from farther out, where the star field draws it
    // like the Sun in Readable mode: never smaller than a sliver of the view, so it shows in its planets' system
    ref.current.scale.setScalar(readable ? Math.max(radius, (0.005 * 10 ** logD) / PC) : radius);
  });
  return (
    <group ref={ref} position={pos}>
      <mesh material={material} onClick={selectOnClick(id)}><sphereGeometry args={[1, 128, 64]} /></mesh>
      <Glow size={5} color={color} opacity={0.9} />
      <Glow size={10} color={color} opacity={0.22} />
    </group>
  );
}
