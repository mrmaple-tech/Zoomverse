// Planets of other stars, drawn in AU like our own. A system is only built while you're at its star
// or one of its planets, so dozens of systems cost nothing until you visit one.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { EXOMOONS, EXOPLANETS, exoLook, exoOffset, moonOffset, type Exomoon, type Exoplanet } from '../data/exoplanets.ts';
import type { Fade } from '../data/layers.ts';
import { get } from '../catalog.ts';
import { AU } from '../lib/coords.ts';
import { simDate, useStore } from '../store.ts';
import { Body, SPHERE } from '../scene/Body.tsx';
import { Orbit } from '../scene/Orbit.tsx';
import { Fader, K } from '../scene/Space.tsx';
import { atmosphereMaterial, planetMaterial } from '../scene/materials.ts';

/** catalog star id → its planets */
const BY_STAR = new Map<string, Exoplanet[]>();
for (const e of EXOPLANETS) { const h = get(e.id).host!; BY_STAR.set(h, [...(BY_STAR.get(h) ?? []), e]); }

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
      {EXOMOONS.filter((m) => planets.some((p) => p.id === m.planet)).map((m) => <Moon key={m.id} m={m} light={light} window={window} />)}
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
      {halo && <mesh scale={1.04} material={halo} geometry={SPHERE} />}
    </Body>
  );
}

const MOON_LOOK = { colors: ['#4a6fa8', '#9db8e0', '#2c4778'] as [string, string, string], bands: 6, turb: 1.5, rim: 0.6 };

/** A candidate exomoon, with its orbit line riding along with its planet. */
function Moon({ m, light, window }: { m: Exomoon; light: { value: Vector3 }; window: Fade }) {
  const material = useMemo(() => planetMaterial(MOON_LOOK, 5, light), [light]);
  const ref = useRef<Group>(null!);
  useFrame(() => ref.current.position.copy(get(m.planet).pos(simDate())).divideScalar(AU));
  const sample = useMemo(() => (f: number) => moonOffset(m, Date.UTC(2000, 0, 1, 12) + f * m.periodDays * 864e5), [m]);
  return (
    <>
      <Body id={m.id} window={window}><primitive object={material} attach="material" /></Body>
      <Fader window={window}><group ref={ref}><Orbit sample={sample} color="#c7d3ea" opacity={0.3} /></group></Fader>
    </>
  );
}
