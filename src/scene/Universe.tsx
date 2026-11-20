import { Suspense, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { WebGLRenderTarget, type Group, type Material, type Mesh, type Object3D } from 'three';
import { AU, KPC, MPC, PC, eqjToScene } from '../lib/coords.ts';
import { get } from '../catalog.ts';
import { simDate, useStore } from '../store.ts';
import { clock, sunWorld } from './materials.ts';
import { Rig } from './Rig.tsx';
import { K, Space } from './Space.tsx';
import { Label } from './Label.tsx';
import { BlackHole } from './BlackHole.tsx';
import { EarthMoonLayer } from '../layers/EarthMoonLayer.tsx';
import { InnerSolarLayer } from '../layers/InnerSolarLayer.tsx';
import { OuterSolarLayer } from '../layers/OuterSolarLayer.tsx';
import { HeliosphereLayer } from '../layers/HeliosphereLayer.tsx';
import { NearbyStarsLayer } from '../layers/NearbyStarsLayer.tsx';
import { NebulaLayer } from '../layers/NebulaLayer.tsx';
import { MilkyWayLayer } from '../layers/MilkyWayLayer.tsx';
import { LocalGroupLayer } from '../layers/LocalGroupLayer.tsx';
import { CosmicWebLayer } from '../layers/CosmicWebLayer.tsx';

const ALWAYS = [-Infinity, -Infinity, Infinity, Infinity] as const;
const ABOVE_POLE = eqjToScene(0, 0, 1).multiplyScalar(get('earth').radiusM! * 1.25);

/** Persistent marker on Earth, visible at every scale. */
function YouAreHere() {
  const ref = useRef<Group>(null!);
  // just above the north pole, so it doesn't cover the globe up close (negligible offset when zoomed out)
  useFrame(() => ref.current.position.copy(get('earth').pos(simDate())).add(ABOVE_POLE).divideScalar(AU));
  return <group ref={ref}><Label id="earth" text="You are here" window={ALWAYS} variant="here" /></group>;
}

const idle = (f: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 200 }) : setTimeout(f, 16));

/**
 * Compiles every layer's shaders up front instead of the first time each layer
 * fades in, which stalled the zoom for ~100 ms per new shader.
 */
function Precompile() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const id = setTimeout(() => {
      const hidden: Object3D[] = [];
      scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
      // match the variants the real render uses: faded materials go transparent (useFade), and the
      // scene draws into the composer's target (no tone mapping, linear output)
      hidden.forEach((h) => h.traverse((o) => {
        const m = (o as Mesh).material as Material | undefined;
        if (m && !Array.isArray(m) && !('uniforms' in m)) m.transparent = true;
      }));
      const rt = new WebGLRenderTarget(1, 1), prev = gl.getRenderTarget();
      gl.setRenderTarget(rt);
      const mats = [...gl.compile(scene, camera)];
      gl.setRenderTarget(prev);
      rt.dispose();
      hidden.forEach((o) => { o.visible = false; });
      // browsers link lazily: fetching uniforms finishes each link now, one per idle slot, not mid-zoom
      const next = () => {
        const m = mats.pop();
        if (!m) return;
        (gl.properties.get(m) as { currentProgram?: { getUniforms(): unknown } }).currentProgram?.getUniforms();
        idle(next);
      };
      idle(next);
    }, 100);
    return () => clearTimeout(id);
  }, [gl, scene, camera]);
  return null;
}

/**
 * Quality tiers for slow GPUs: 2 = full, 1 = lower resolution, 0 = also no bloom. Quality only ever
 * steps down: flipping back and forth rebuilt the effect chain (shader compiles + resizes) each time,
 * which was itself a source of stutter.
 */
// top tier: full sharpness on high-DPI screens (capped at 2), 1.5 on ordinary ones
export const TOP_DPR = Math.max(1.5, Math.min(2, window.devicePixelRatio));
const DPR = [1, 1, TOP_DPR];

export function Universe() {
  const [tier, setTier] = useState(2);
  // Layers 4–8 generate hundreds of thousands of procedural points; build them once the browser
  // is idle after the first paint so Earth appears immediately.
  const [far, setFar] = useState(false);
  useEffect(() => {
    const go = () => setFar(true);
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(go, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(go, 800);
    return () => clearTimeout(id);
  }, []);
  // Texture uploads and shader compiles make the first seconds stutter on any GPU; judging the frame
  // rate then dropped fast machines to low quality for good. Start watching once loading has settled.
  const [watch, setWatch] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setWatch(true), 6000);
    return () => clearTimeout(id);
  }, []);
  const setDpr = useThree((s) => s.setDpr);
  const step = (d: number) => setTier((t) => {
    const n = Math.max(0, t + d);
    setDpr(DPR[n]);
    return n;
  });
  useFrame((_, dt) => {
    const { focus, logD } = useStore.getState();
    sunWorld.value.copy(focus).multiplyScalar(-K / 10 ** logD); // the Sun is the world origin
    clock.value += dt;
  });
  return (
    <>
      <color attach="background" args={['#020308']} />
      {watch && <PerformanceMonitor onDecline={() => step(-1)} />}
      <ambientLight intensity={0.06} />
      <Stars radius={300} depth={80} count={7000} factor={5} saturation={0.4} fade />
      <Rig />
      <Space unit={AU}>
        {/* Precompile waits inside the boundary so Earth's textured materials exist when it runs */}
        <Suspense fallback={null}><EarthMoonLayer />{far && <Precompile />}</Suspense>
        <InnerSolarLayer />
        <OuterSolarLayer />
        {far && <HeliosphereLayer />}
        <YouAreHere />
      </Space>
      {far && (
        <>
          <Space unit={PC}><NearbyStarsLayer /><NebulaLayer /></Space>
          <Space unit={KPC}><MilkyWayLayer /></Space>
          <Space unit={KPC}><LocalGroupLayer /></Space>
          <Space unit={MPC}><CosmicWebLayer /></Space>
          <BlackHole />
        </>
      )}
      {/* no MSAA: it multiplies the cost of every point/additive pixel; dpr 1.5 + bloom keep edges soft */}
      {/* always on: it does the linear→sRGB output conversion the custom shaders rely on; switching it off
          on slow GPUs rendered Earth dark and oversaturated. The lowest tier only drops bloom. */}
      <EffectComposer multisampling={0}>
        {tier > 0 ? <Bloom mipmapBlur levels={5} luminanceThreshold={0.85} intensity={0.9} radius={0.7} /> : <></>}
        <Vignette offset={0.3} darkness={0.65} />
      </EffectComposer>
    </>
  );
}
