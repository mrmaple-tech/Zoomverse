// The Norma Cluster (Mpc space), and the streams of light used to show galaxies falling into a supercluster.
import { useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three';
import { NORMA } from '../data/deepSky.ts';
import type { Fade } from '../data/layers.ts';
import { galDir, gauss, rng } from '../lib/coords.ts';
import { Inspectable } from '../scene/Inspectable.tsx';
import { clock } from '../scene/materials.ts';
import type { CloudStep } from '../scene/useCloud.ts';

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

const NORMA_SHOWN: Fade = [21.6, 22.4, 24.6, 25.2];
const NORMA_LABEL: Fade = [22.6, 23.0, 24.1, 24.5];

/** The Norma Cluster, at the heart of the Great Attractor (itself one of the superclusters), to zoom into galaxy by galaxy. */
export function AttractorLayer() {
  return (
    <Inspectable
      id={NORMA.id} name={NORMA.name} window={NORMA_SHOWN} label={NORMA_LABEL} position={galDir(NORMA.l, NORMA.b).multiplyScalar(NORMA.distMpc).toArray()}
      coarse={CLUSTER(4000, 1.4)} fine={CLUSTER(90_000, 0.6)} size={[0.03, 0.012]}
    />
  );
}
