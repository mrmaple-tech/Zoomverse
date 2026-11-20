import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Group } from 'three';
import { STARS, FAMOUS_STARS } from '../data/stars.ts';
import { LAYERS } from '../data/layers.ts';
import { PC, eqjToScene } from '../lib/coords.ts';
import { get } from '../catalog.ts';
import { starColor, starTemp } from '../lib/stars.ts';
import { selectOnClick, useStore } from '../store.ts';
import { sunMaterial } from '../scene/materials.ts';
import { Glow } from '../scene/Glow.tsx';
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
  const id = useStore((s) => {
    const f = s.flight?.to ?? s.focusId;
    return f?.startsWith('star-') ? f : null;
  });
  return id ? <StarBody key={id} id={id} /> : null;
}

const WHITE: [number, number, number] = [1, 1, 1];
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];

function StarBody({ id }: { id: string }) {
  const ref = useRef<Group>(null!);
  const { pos, radius, material, color } = useMemo(() => {
    const [, x, y, z, , , bv] = STARS[+id.slice(5)];
    const t = starTemp(bv), rSun = get(id).radiusM! / 6.957e8;
    // blackbody colors are pale; push the saturation up so a red giant reads red and a hot star blue
    const raw = starColor(t), top = Math.max(...raw), col = raw.map((v) => Math.max(0, top - (top - v) * 2.2)) as [number, number, number];
    // cool stars darken toward red in their granulation gaps; hot ones stay their own color
    const dark: [number, number, number] = t < 6500 ? [col[0], col[1] * 0.5, col[2] * 0.3] : mix(col, [0, 0, 0], 0.4);
    const light = mix(col, WHITE, 0.12);
    return {
      pos: eqjToScene(x, y, z).toArray(),
      radius: get(id).radiusM! / PC,
      // giants have far bigger convection cells relative to their size
      material: sunMaterial(dark, light, 1 / (1 + 0.25 * Math.log2(Math.max(1, rSun)))),
      color: `#${new Color(...light).getHexString()}`,
    };
  }, [id]);
  // sub-pixel from farther out, where the star field draws it
  useFrame(() => { ref.current.visible = useStore.getState().logD < 15.4; });
  return (
    <group ref={ref} position={pos} scale={radius}>
      <mesh material={material} onClick={selectOnClick(id)}><sphereGeometry args={[1, 128, 64]} /></mesh>
      <Glow size={5} color={color} opacity={0.9} />
      <Glow size={10} color={color} opacity={0.22} />
    </group>
  );
}
