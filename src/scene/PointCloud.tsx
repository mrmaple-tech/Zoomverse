import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { BufferGeometry } from 'three';
import { cloud as rawCloud } from './cloud.ts';
import { toGeometry } from './useCloud.ts';
import type { ThreeEvent } from '@react-three/fiber';
import { pointsMaterial } from './materials.ts';
import { useStore } from '../store.ts';

const J2000 = Date.UTC(2000, 0, 1, 12);

/** Builder for small point clouds made on the main thread: push(x, y, z, r, g, b, sizePx), then build(). */
export function cloud() {
  const c = rawCloud();
  return { push: c.push, build: () => toGeometry(c.arrays()) };
}

interface Props {
  geometry: BufferGeometry;
  opacity?: number;
  /** Rotate points by their aSpeed with simulation time. */
  spin?: boolean;
  /** World size (parent units) of a size-1 point; enables distance-attenuated points. */
  worldSize?: number;
  onPick?: (index: number) => void;
}

/** One draw call for thousands of points. */
export function PointCloud({ geometry, opacity = 1, spin, worldSize = 0, onPick }: Props) {
  const material = useMemo(() => pointsMaterial(opacity), [opacity]);
  useFrame(({ size }) => {
    material.uniforms.uWorld.value = worldSize;
    material.uniforms.uHalfH.value = size.height / 2;
    if (spin) material.uniforms.uDays.value = (useStore.getState().simTime - J2000) / 864e5;
  });
  const click = onPick && ((e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6 || e.index === undefined) return;
    e.stopPropagation();
    onPick(e.index);
  });
  return <points geometry={geometry} material={material} onClick={click} />;
}
