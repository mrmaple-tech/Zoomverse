// A solar-system body: a sphere at its live position, sized true-to-scale or
// "readable" (never smaller than a few pixels), plus its label.
import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { SphereGeometry, type Group, type Mesh } from 'three';
import { useStore, simDate, selectOnClick, flyOnDoubleClick } from '../store.ts';
import { get } from '../catalog.ts';
import { AU } from '../lib/coords.ts';
import type { Fade } from '../data/layers.ts';
import { Label } from './Label.tsx';
import { MOBILE } from '../lib/device.ts';
import { useFade } from './Space.tsx';

/** One unit sphere shared by every body (and its halo): each used to build its own 8k-vertex copy. */
export const SPHERE = MOBILE ? new SphereGeometry(1, 64, 32) : new SphereGeometry(1, 128, 64);

interface Props {
  id: string;
  window: Fade;
  /** Readable mode: minimum radius as a fraction of camera distance. */
  minFrac?: number;
  /** Sphere material (and any extras sized with the body, e.g. rings). */
  children: ReactNode;
  label?: boolean;
  onFrame?: (mesh: Mesh) => void;
}

export function Body({ id, window, minFrac = 0.006, children, label = true, onFrame }: Props) {
  const obj = get(id);
  const group = useRef<Group>(null!);
  const mesh = useRef<Mesh>(null!);
  // Up close a body is always drawn (you may have flown to it); its label keeps the full window.
  useFade([-Infinity, -Infinity, window[2], window[3]], group);
  useFrame(() => {
    const { logD, readable } = useStore.getState();
    group.current.position.copy(obj.pos(simDate())).divideScalar(AU);
    const R = obj.radiusM ?? 0;
    const r = readable ? Math.max(R, minFrac * 10 ** logD) : R;
    mesh.current.scale.setScalar(r / AU);
    onFrame?.(mesh.current);
  });
  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={SPHERE} onClick={selectOnClick(id)} onDoubleClick={flyOnDoubleClick(id)}>
        {children}
      </mesh>
      {label && <Label id={id} text={obj.name} window={window} />}
    </group>
  );
}
