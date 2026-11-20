// Floating origin. World positions are float64 meters; each Space renders its
// children in local units (AU, pc, kpc, Mpc) and is re-scaled every frame so the
// camera always sits K units from the focus. GPU-side numbers therefore stay small.
import { useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Material, Mesh, Object3D, ShaderMaterial } from 'three';
import { useStore } from '../store.ts';
import { fade } from '../lib/coords.ts';
import { byId } from '../catalog.ts';
import type { Fade } from '../data/layers.ts';

export const K = 10;
export function Space({ unit, children }: { unit: number; children: ReactNode }) {
  const ref = useRef<Group>(null!);
  useFrame(() => {
    const s = K / 10 ** useStore.getState().logD;
    ref.current.scale.setScalar(unit * s);
    ref.current.position.copy(useStore.getState().focus).multiplyScalar(-s);
  });
  return <group ref={ref}>{children}</group>;
}

/** You're at `id`: focused on it, flying to it, or at something it hosts (a galaxy's central black hole). */
export function atObject(id: string, s: { focusId: string | null; flight: { to: string } | null }) {
  const f = s.flight?.to ?? s.focusId;
  return !!f && (f === id || byId.get(f)?.host === id);
}

/**
 * Cross-fade everything under `ref` by the zoom window; hides it entirely when faded out.
 * With `id`, it stays fully shown while that object is focused or being flown to (closer than the window's end).
 */
export function useFade(window: Fade, ref: RefObject<Object3D>, id?: string) {
  useFrame(() => {
    const s = useStore.getState();
    const o = id && atObject(id, s) && s.logD < window[2] ? 1 : fade(s.logD, window);
    const root = ref.current;
    if (!root) return;
    root.userData.fade = o;
    root.visible = o > 0.003;
    if (!root.visible) return;
    root.traverse((c) => {
      const m = (c as Mesh).material as (Material & Partial<ShaderMaterial>) | undefined;
      if (!m || Array.isArray(m)) return;
      // nested faders multiply
      let f = 1;
      for (let p: Object3D | null = c; p; p = p.parent) f *= p.userData.fade ?? 1;
      m.userData.base ??= m.uniforms?.uOpacity ? m.uniforms.uOpacity.value : m.opacity;
      if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = m.userData.base * f;
      else { m.opacity = m.userData.base * f; m.transparent = true; }
    });
  });
}

/** A group whose content cross-fades with a layer. */
export function Fader({ window, id, children }: { window: Fade; id?: string; children: ReactNode }) {
  const ref = useRef<Group>(null!);
  useFade(window, ref, id);
  return <group ref={ref}>{children}</group>;
}
