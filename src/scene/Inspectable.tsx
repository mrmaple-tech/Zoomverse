// A procedural object you can fly to and explore (galaxy, nebula): a light point cloud for viewing
// from afar, replaced by a far denser one the first time you fly to it.
import { useMemo, useState } from 'react';
import type { BufferGeometry, Quaternion } from 'three';
import { useStore } from '../store.ts';
import type { Fade } from '../data/layers.ts';
import { Label } from './Label.tsx';
import { Glow } from './Glow.tsx';
import { Fader } from './Space.tsx';
import { PointCloud } from './PointCloud.tsx';

interface Props {
  id: string;
  name: string;
  /** Shown within these zooms, and always while focused. */
  window: Fade;
  label: Fade;
  position: [number, number, number];
  quaternion?: Quaternion;
  coarse: () => BufferGeometry;
  fine: () => BufferGeometry;
  /** World size (parent units) of a size-1 point, from afar and up close. */
  size: [number, number];
  /** From afar a soft halo stands in for the object's light; up close its own haze does that. */
  glow?: { size: number; color: string };
}

export function Inspectable({ id, name, window, label, position, quaternion, coarse, fine, size, glow }: Props) {
  const focused = useStore((s) => s.focusId === id || s.flight?.to === id);
  const [detail, setDetail] = useState(false);
  if (focused && !detail) setDetail(true);
  const far = useMemo(coarse, []); // eslint-disable-line react-hooks/exhaustive-deps
  const near = useMemo(() => (detail ? fine() : null), [detail]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Fader window={window} id={id}>
      <group position={position}>
        <group quaternion={quaternion}>
          {near ? <PointCloud geometry={near} worldSize={size[1]} /> : <PointCloud geometry={far} worldSize={size[0]} />}
        </group>
        {glow && !near && <Glow size={glow.size} color={glow.color} opacity={0.7} />}
        <Label id={id} text={name} window={label} />
      </group>
    </Fader>
  );
}
