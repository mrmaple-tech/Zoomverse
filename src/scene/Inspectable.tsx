// A procedural object you can fly to and explore (galaxy, nebula): a light point cloud for viewing
// from afar, replaced by a far denser one the first time you fly to it.
import { useState, type ReactNode } from 'react';
import type { Quaternion } from 'three';
import { useStore } from '../store.ts';
import type { Fade } from '../data/layers.ts';
import { Label } from './Label.tsx';
import { Glow } from './Glow.tsx';
import { Fader } from './Space.tsx';
import { PointCloud } from './PointCloud.tsx';
import { useCloud, type CloudStep } from './useCloud.ts';

interface Props {
  id: string;
  name: string;
  /** Shown within these zooms, and always while focused. */
  window: Fade;
  label: Fade;
  position: [number, number, number];
  quaternion?: Quaternion;
  /** Worker recipes for the light and the detailed cloud. */
  coarse: CloudStep[];
  fine: CloudStep[];
  /** World size (parent units) of a size-1 point, from afar and up close. */
  size: [number, number];
  /** From afar a soft halo stands in for the object's light; up close its own haze does that. */
  glow?: { size: number; color: string; opacity?: number };
  /** Extra content placed with it (same position). */
  children?: ReactNode;
}

export function Inspectable({ id, name, window, label, position, quaternion, coarse, fine, size, glow, children }: Props) {
  const focused = useStore((s) => s.focusId === id || s.flight?.to === id);
  const [detail, setDetail] = useState(false);
  if (focused && !detail) setDetail(true);
  const far = useCloud(coarse);
  const near = useCloud(detail ? fine : null); // the light one stays up until this arrives
  return (
    <Fader window={window} id={id}>
      <group position={position}>
        <group quaternion={quaternion}>
          {near ? <PointCloud geometry={near} worldSize={size[1]} /> : far && <PointCloud geometry={far} worldSize={size[0]} />}
        </group>
        {glow && !near && <Glow size={glow.size} color={glow.color} opacity={glow.opacity ?? 0.7} />}
        {children}
        <Label id={id} text={name} window={label} />
      </group>
    </Fader>
  );
}
