import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group, Object3D } from 'three';
import { useStore, visit } from '../store.ts';
import { fade } from '../lib/coords.ts';
import { byId } from '../catalog.ts';
import type { Fade } from '../data/layers.ts';

interface Props {
  id: string;
  text: string;
  window: Fade;
  position?: [number, number, number];
  variant?: 'here' | 'faint' | 'marker';
  /** Extra per-frame visibility test (e.g. hidden behind the globe). */
  shown?: () => boolean;
}

/** Clickable DOM label pinned to a 3D point. Doubles as the hit target for tiny objects. */
export function Label({ id, text, window, position, variant, shown }: Props) {
  const el = useRef<HTMLButtonElement>(null!), anchor = useRef<Group>(null);
  const selected = useStore((s) => s.selected === id);
  // labels for layers you can't see aren't mounted, so they cost nothing per frame
  const on = useStore((s) => s.show.labels);
  const live = useStore((s) => s.focusId === id || s.flight?.to === id || fade(s.logD, window) > 0.01);
  useFrame(() => {
    if (!el.current) return; // Html mounts its DOM a frame later
    const s = useStore.getState();
    // the focused object stays labeled up close, but not once zoomed out past its own window
    let o = shown && !shown() ? 0 : (s.focusId === id || s.flight?.to === id) && s.logD < window[2] ? 1 : fade(s.logD, window);
    // labels go by zoom, not by place: hide ones whose object is way off in the distance from where
    // you're looking (the planets' labels while you're at Sirius, say). "You are here" always shows, and
    // satellites (always beside Earth) skip the check: it would rerun their orbit math every frame.
    const obj = byId.get(id);
    if (o > 0 && obj && !obj.earthOrbit && variant !== 'here' && obj.pos(new Date(s.simTime)).distanceTo(s.focus) > 100 * 10 ** s.logD) o = 0;
    // a label is HTML laid over the canvas, so it must hide itself when its 3D object is hidden (a planet the red giant swallowed)
    for (let p: Object3D | null = anchor.current; p && o > 0; p = p.parent) if (!p.visible) o = 0;
    el.current.style.opacity = String(o);
    el.current.style.visibility = o < 0.25 ? 'hidden' : 'visible';
  });
  if (!live || !on) return null;
  return (
    <group ref={anchor} position={position}>
    <Html zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <button
        ref={el}
        className={`label ${variant ?? ''} ${selected ? 'selected' : ''}`}
        onClick={() => useStore.getState().select(id)}
        onDoubleClick={() => visit(id)}
      >
        {(variant === 'here' || variant === 'marker') && <span className="pin" aria-hidden />}
        {text}
      </button>
    </Html>
    </group>
  );
}
