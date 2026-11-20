// Planets of other stars, drawn in AU like our own. A system is only built while you're at its star
// or one of its planets, so dozens of systems cost nothing until you visit one.
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { EXOPLANETS, exoLook, exoOffset, type Exoplanet } from '../data/exoplanets.ts';
import type { Fade } from '../data/layers.ts';
import { get } from '../catalog.ts';
import { AU } from '../lib/coords.ts';
import { useStore } from '../store.ts';
import { Body } from '../scene/Body.tsx';
import { Orbit } from '../scene/Orbit.tsx';
import { Fader, K } from '../scene/Space.tsx';
import { atmosphereMaterial, planetMaterial } from '../scene/materials.ts';

const SYSTEMS = new Map<string, Exoplanet[]>();
for (const e of EXOPLANETS) SYSTEMS.set(e.host, [...(SYSTEMS.get(e.host) ?? []), e]);
/** catalog star id → its planets */
const BY_STAR = new Map([...SYSTEMS.values()].map((ps) => [get(ps[0].id).host!, ps]));

/** The star whose system you're at (focused on, or flying to, the star or one of its planets). */
export const visitedStar = (id: string | null | undefined) => (!id ? null : id.startsWith('exo-') ? get(id).host! : BY_STAR.has(id) ? id : null);

export function ExoplanetLayer() {
  const star = useStore((s) => visitedStar(s.flight?.to ?? s.focusId));
  return star ? <System key={star} star={star} planets={BY_STAR.get(star)!} /> : null;
}

function System({ star, planets }: { star: string; planets: Exoplanet[] }) {
  const center = useMemo(() => get(star).pos(new Date()).clone(), [star]);
  // the planets are lit from their own star, wherever the floating origin is
  const light = useMemo(() => ({ value: new Vector3() }), []);
  useFrame(() => {
    const { focus, logD } = useStore.getState();
    light.value.copy(center).sub(focus).multiplyScalar(K / 10 ** logD);
  });
  // drawn and labeled from close in out to a few times the system's size
  const outer = Math.log10(Math.max(...planets.map((p) => p.a)) * AU);
  const window: Fade = [-Infinity, -Infinity, outer + 1.4, outer + 2];
  return (
    <>
      {planets.map((p) => <Planet key={p.id} p={p} light={light} window={window} />)}
      <Fader window={window}>
        <group position={center.clone().divideScalar(AU).toArray()}>
          {planets.map((p) => <Orbit key={p.id} sample={(f) => exoOffset(p, Date.UTC(2000, 0, 1, 12) + f * p.periodDays * 864e5)} color="#9fb3d9" opacity={0.3} />)}
        </group>
      </Fader>
    </>
  );
}

function Planet({ p, light, window }: { p: Exoplanet; light: { value: Vector3 }; window: Fade }) {
  const look = exoLook(p);
  const material = useMemo(() => planetMaterial(look, (p.radiusEarth * 7.3) % 17, light), [p, look, light]);
  const halo = useMemo(() => (look.rim > 0.2 ? atmosphereMaterial(look.colors[1], 1.04, light) : null), [look, light]);
  return (
    <Body id={p.id} window={window}>
      <primitive object={material} attach="material" />
      {halo && <mesh scale={1.04} material={halo}><sphereGeometry args={[1, 64, 32]} /></mesh>}
    </Body>
  );
}
