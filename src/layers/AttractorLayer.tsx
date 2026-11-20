// The Great Attractor (Mpc space): the clusters around it, the galaxy filaments joining them, streams of
// light showing galaxies falling in, and the Norma Cluster at its heart to zoom into, galaxy by galaxy.
import { useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three';
import { ATTRACTOR_CLUSTERS as CLUSTERS, NORMA, STRUCTURES } from '../data/deepSky.ts';
import type { Fade } from '../data/layers.ts';
import { galDir, gauss, rng } from '../lib/coords.ts';
import { Inspectable } from '../scene/Inspectable.tsx';
import { clock } from '../scene/materials.ts';
import type { CloudStep } from '../scene/useCloud.ts';

const GA = STRUCTURES.find((s) => s.id === 'great-attractor')!;
const CENTER = galDir(GA.l, GA.b).multiplyScalar(GA.distMpc);
// cluster centers relative to the Great Attractor's position
const OFFSETS = CLUSTERS.map((k) => galDir(k.l, k.b).multiplyScalar(k.distMpc).sub(CENTER));
const R = GA.sizeMpc / 2;

const REGION = (count: number, bright: number): CloudStep[] => [{
  gen: 'supercluster',
  opts: { count, radius: R, seed: 71, bright, clusters: CLUSTERS.flatMap((k, i) => [OFFSETS[i].x, OFFSETS[i].y, OFFSETS[i].z, k.radiusMpc, k.share]) },
}];
const CLUSTER = (count: number, bright: number): CloudStep[] => [{ gen: 'cluster', opts: { count, radius: NORMA.sizeMpc / 2, seed: 72, bright, jellyfish: 1 } }];

/** Streaks of light falling in toward the heaviest cluster from all around: the attraction made visible. */
function flowMaterial() {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uTime: clock, uOpacity: { value: 1 }, uPx: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: /* glsl */ `
      attribute float aPhase; uniform float uTime, uPx; varying float vA;
      void main() {
        float f = fract(uTime * 0.05 + aPhase);       // one trip in ~20 s, endlessly
        vec3 p = position * (1.0 - f * f * 0.92);       // speeding up as it falls in
        vA = smoothstep(0.0, 0.15, f) * (1.0 - smoothstep(0.8, 1.0, f));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 2.2 * uPx;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        gl_FragColor = vec4(vec3(0.55, 0.8, 1.0) * 0.8, vA * (1.0 - r * r) * uOpacity);
      }`,
  });
}

/** Light falling in toward `position` from a shell of `radius` (parent units). */
export function Flow({ radius, position, count = 4000, seed = 73 }: { radius: number; position: [number, number, number]; count?: number; seed?: number }) {
  const { geometry, material } = useMemo(() => {
    const r = rng(seed), n = count, pos = new Float32Array(n * 3), phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = gauss(r), y = gauss(r), z = gauss(r), l = Math.hypot(x, y, z) || 1, d = radius * (1.1 + r() * 0.9);
      pos.set([(x / l) * d, (y / l) * d, (z / l) * d], i * 3);
      phase[i] = r();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aPhase', new BufferAttribute(phase, 1));
    return { geometry: g, material: flowMaterial() };
  }, [radius, count, seed]);
  return <points geometry={geometry} material={material} position={position} />;
}

const GA_SHOWN: Fade = [23.0, 23.8, 26.0, 26.6];
const GA_LABEL: Fade = [23.6, 24.0, 25.4, 26.0];
const NORMA_SHOWN: Fade = [21.6, 22.4, 24.6, 25.2];
const NORMA_LABEL: Fade = [22.6, 23.0, 24.1, 24.5];

export function AttractorLayer() {
  return (
    <>
      <Inspectable
        id={GA.id} name={GA.name} window={GA_SHOWN} label={GA_LABEL} position={CENTER.toArray()}
        coarse={REGION(8000, 1.6)} fine={REGION(150_000, 0.55)} size={[0.25, 0.09]}
        glow={{ size: R * 0.8, color: '#b9a8ff' }}
      >
        {/* the flow converges on the Norma Cluster, the heaviest of the group */}
        <Flow radius={R} position={OFFSETS[0].toArray()} />
      </Inspectable>
      <Inspectable
        id={NORMA.id} name={NORMA.name} window={NORMA_SHOWN} label={NORMA_LABEL} position={galDir(NORMA.l, NORMA.b).multiplyScalar(NORMA.distMpc).toArray()}
        coarse={CLUSTER(4000, 1.4)} fine={CLUSTER(90_000, 0.6)} size={[0.03, 0.012]}
      />
    </>
  );
}
