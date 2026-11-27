import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AU } from '../lib/coords.ts';
import { simDate, useStore } from '../store.ts';
import { swallowedTo } from '../scene/Events.tsx';
import { get } from '../catalog.ts';
import { BODIES, SUN, type SolarBody } from '../data/solarSystem.ts';
import { LAYERS } from '../data/layers.ts';
import { Body, SPHERE } from '../scene/Body.tsx';
import { Orbit, planetSampler } from '../scene/Orbit.tsx';
import { Fader } from '../scene/Space.tsx';
import { Glow } from '../scene/Glow.tsx';
import { atmosphereMaterial, planetMaterial, sunMaterial } from '../scene/materials.ts';

const LAYER = LAYERS[1];

export function Planet({ b, children }: { b: SolarBody; children?: ReactNode }) {
  const material = useMemo(() => planetMaterial(b.look!, b.radiusKm % 17), [b]);
  const halo = useMemo(() => (b.look!.rim > 0.2 ? atmosphereMaterial(b.look!.colors[1], 1.04) : null), [b]);
  // gone once the red-giant Sun (time-lapse) has swelled past its orbit
  const ref = useRef<Group>(null!);
  useFrame(() => { ref.current.visible = swallowedTo() < get(b.id).pos(simDate()).length() / AU; });
  return (
    <group ref={ref}>
      <Body id={b.id} window={b.fade}>
        <primitive object={material} attach="material" />
        {halo && <mesh scale={1.04} material={halo} geometry={SPHERE} />}
        {children}
      </Body>
    </group>
  );
}

export function Orbits({ layer, fade }: { layer: number; fade: typeof LAYER.fade }) {
  const samplers = useMemo(() => {
    const now = Date.now();
    return BODIES.filter((b) => b.layer === layer || (layer === 2 && b.id === 'earth')).map((b) => planetSampler(get(b.id).pos, b.periodDays, now));
  }, [layer]);
  return <Fader window={fade}>{samplers.map((s, i) => <Orbit key={i} sample={s} />)}</Fader>;
}

export function InnerSolarLayer() {
  const sun = useMemo(sunMaterial, []);
  const future = useStore((s) => s.event?.id === 'red-giant'); // the time-lapse draws the aging Sun
  return (
    <>
      <pointLight position={[0, 0, 0]} intensity={2.6} decay={0} />
      {!future && (
        <Body id="sun" window={SUN.fade} minFrac={0.005}>
          <primitive object={sun} attach="material" />
          <Glow size={5} color="#ffd38a" opacity={0.9} />
          <Glow size={10} color="#ff9a3c" opacity={0.22} />
        </Body>
      )}
      {BODIES.filter((b) => b.layer === 2).map((b) => <Planet key={b.id} b={b} />)}
      <Orbits layer={2} fade={LAYER.fade} />
    </>
  );
}
