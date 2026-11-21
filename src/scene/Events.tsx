// Time-lapse scenes: the Milky Way–Andromeda merger, Betelgeuse's supernova and the Sun's red-giant
// future. A controller runs each one's own clock and steers the camera; the scenes are simulations
// drawn in the same floating-origin spaces as everything else.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, Color, Matrix3, Matrix4, ShaderMaterial, Vector3, type Group } from 'three';
import { SN_BANG, eventById, mergerGyr, pnRadiusAU, snShellPc, snYears, sunAt, sunReachAU, type EventId } from '../data/events.ts';
import { GALAXIES, MILKY_WAY as MW } from '../data/deepSky.ts';
import { STARS } from '../data/stars.ts';
import { get } from '../catalog.ts';
import { AU, GAL_BASIS, KPC, PC, galDir, gauss, rng } from '../lib/coords.ts';
import { starColor } from '../lib/stars.ts';
import { MOBILE } from '../lib/device.ts';
import { useStore } from '../store.ts';
import { orient } from '../layers/LocalGroupLayer.tsx';
import { Glow } from './Glow.tsx';
import { Label } from './Label.tsx';
import { PointCloud, cloud } from './PointCloud.tsx';
import { Space } from './Space.tsx';
import { starTint, sunMaterial } from './materials.ts';
import { addSpiral } from './galaxy.ts';
import { useCloud, type CloudStep } from './useCloud.ts';
import { unitVec } from '../lib/random.ts';

const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const BETELGEUSE = `star-${STARS.findIndex((s) => s[0] === 'Betelgeuse')}`;

/** Where each time-lapse happens, and how far the camera sits (log10 m) as it plays. */
const FOCUS: Record<EventId, string> = { merger: 'local-group', supernova: BETELGEUSE, 'red-giant': 'sun' };
function cameraAt(id: EventId, t: number) {
  if (id === 'merger') return Math.log10(Math.max(merger(t).sep * 1.7, 210) * KPC); // no closer than the Local Group allows
  if (id === 'supernova') return Math.max(Math.log10(get(BETELGEUSE).radiusM! * 7), Math.log10(snShellPc(snYears(t)) * PC * 3.2));
  return Math.max(11.55, Math.log10(pnRadiusAU(t) * AU * 2.8)); // the inner planets, then out with the nebula
}

export const startEvent = (id: EventId) => {
  const s = useStore.getState();
  s.set({ event: { id, t: 0, playing: true }, tour: null, caption: null, selected: null, panel: null });
  s.flyTo(FOCUS[id], cameraAt(id, 0), id === 'merger' ? MERGER_VIEW : undefined);
};
export const endEvent = () => useStore.getState().set({ event: null });

/** Runs the clock (once the camera has arrived) and keeps the camera framed while it plays or is scrubbed. */
function Controller() {
  const lastT = useRef(-1);
  useFrame((_, dt) => {
    const s = useStore.getState(), e = s.event;
    if (!e || s.flight) return;
    let { t } = e;
    if (e.playing) {
      t = Math.min(1, t + Math.min(dt, 0.1) / eventById(e.id).seconds);
      s.set({ event: { ...e, t, playing: t < 1 } });
    }
    if (t !== lastT.current) s.set({ targetLogD: cameraAt(e.id, t) });
    lastT.current = t;
  });
  return null;
}

/* ---------------------------------- Milky Way + Andromeda ---------------------------------- */

const MW0 = new Vector3(MW.sunDistKpc, 0, 0).applyMatrix4(GAL_BASIS);
const M31 = GALAXIES.find((g) => g.id === 'andromeda')!;
const M310 = galDir(M31.l, M31.b).multiplyScalar(M31.distKpc);
const U = () => M310.clone().sub(MW0).normalize();
/** The orbit's plane: the line between them and a perpendicular roughly toward galactic north. */
const W = () => { const u = U(); return new Vector3(0, 0, 1).applyMatrix4(GAL_BASIS).addScaledVector(u, -u.z).normalize(); };
// looking down on the Milky Way's disk, tipped a little back from Andromeda, so both galaxies read as galaxies
const MERGER_VIEW = new Vector3(0, 0, 1).applyMatrix4(GAL_BASIS).multiplyScalar(0.85).addScaledVector(U(), -0.45).normalize();

/** Separation (kpc) and orbital angle (degrees) through time: a classic merger forecast, rounded. */
const ORBIT: [number, number, number][] = [
  [0, 770, 0], [3.0, 430, 4], [3.9, 160, 14], [4.3, 26, 80], [4.6, 115, 160], [5.0, 165, 185], [5.35, 95, 215],
  [5.65, 24, 305], [5.9, 9, 400], [6.2, 1.5, 500], [7, 0, 540],
];
function merger(t: number) {
  const T = mergerGyr(t);
  let i = 0;
  while (i < ORBIT.length - 2 && T > ORBIT[i + 1][0]) i++;
  const [t0, s0, a0] = ORBIT[i], [t1, s1, a1] = ORBIT[i + 1], f = smooth(t0, t1, T);
  return { T, sep: s0 + (s1 - s0) * f, angle: ((a0 + (a1 - a0) * f) * Math.PI) / 180 };
}

const mergerMaterial = () => new ShaderMaterial({
  transparent: true, depthWrite: false, blending: AdditiveBlending,
  uniforms: {
    uC: { value: [new Vector3(), new Vector3()] }, uRot: { value: [new Matrix3(), new Matrix3()] }, uR: { value: [MW.diameterKpc / 2, M31.diameterKpc / 2] },
    uSpin: { value: 0 }, uTide: { value: 0 }, uMerge: { value: 0 }, uAxis: { value: new Vector3() }, uCenter: { value: new Vector3() },
    uOpacity: { value: 1 }, uPx: { value: Math.min(devicePixelRatio, 2) }, uWorld: { value: 0.22 }, uHalfH: { value: 400 },
  },
  vertexShader: /* glsl */ `
    attribute vec3 color; attribute float size; attribute float aGal; attribute vec3 aFinal;
    uniform vec3 uC[2]; uniform mat3 uRot[2]; uniform float uR[2];
    uniform float uSpin, uTide, uMerge, uPx, uWorld, uHalfH; uniform vec3 uAxis, uCenter;
    varying vec3 vColor; varying float vFade;
    void main() {
      int g = int(aGal + 0.5);
      // each star keeps circling its galaxy (inner ones faster)
      float r = length(position.xy), a = atan(position.y, position.x) + uSpin / (0.25 + r / uR[g]);
      vec3 p = uC[g] + uRot[g] * vec3(cos(a) * r, sin(a) * r, position.z);
      // tidal tails: after the first pass, outer stars are stretched out along the line of the encounter
      float along = dot(p - uC[g], uAxis);
      p += uAxis * along * uTide * (r / uR[g]) * (r / uR[g]) * (1.0 + 0.6 * sin(a * 2.0));
      // finally everything settles into one elliptical galaxy
      p = mix(p, uCenter + aFinal, uMerge);
      vColor = mix(color, vec3(dot(color, vec3(0.33))) * vec3(1.15, 0.95, 0.75), uMerge * 0.7);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float px = size * uWorld * length(modelViewMatrix[0].xyz) * projectionMatrix[1][1] * uHalfH / -mv.z;
      vFade = min(px * px, 1.0);
      gl_PointSize = clamp(px, 1.0, max(4.0, size * 1.4)) * uPx;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uOpacity; varying vec3 vColor; varying float vFade;
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      gl_FragColor = vec4(vColor, exp(-r * r * 5.0) * (1.0 - smoothstep(0.85, 1.0, r)) * vFade * uOpacity);
    }`,
});

function Merger() {
  const { geometry, material } = useMemo(() => {
    const c = cloud(), n = MOBILE ? 0.5 : 1, gal: number[] = [];
    let pushed = 0;
    const counted = { push: (...a: Parameters<typeof c.push>) => { pushed++; c.push(...a); } };
    addSpiral(counted, { count: 40_000 * n, radius: MW.diameterKpc / 2, seed: 3, bright: 3.2, arms: 4, bar: 0.25 });
    const nMW = pushed;
    addSpiral(counted, { count: 50_000 * n, radius: M31.diameterKpc / 2, seed: 20, bright: 3.2, arms: 2, pitchDeg: 9, bulge: 0.14 });
    const geo = c.build(), count = geo.getAttribute('position').count, r = rng(9), fin = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      gal.push(i < nMW ? 0 : 1);
      // a spot in the final elliptical, keeping each star's rough distance from the center
      const p = geo.getAttribute('position'), d = Math.hypot(p.getX(i), p.getY(i)) * 1.1 + Math.abs(gauss(r)) * 2;
      const [x, y, z] = unitVec(r);
      fin.set([x * d, y * d * 0.8, z * d * 0.62], i * 3);
    }
    geo.setAttribute('aGal', new BufferAttribute(new Float32Array(gal), 1));
    geo.setAttribute('aFinal', new BufferAttribute(fin, 3));
    return { geometry: geo, material: mergerMaterial() };
  }, []);
  const labels = [useRef<Group>(null!), useRef<Group>(null!)];
  const rotMW = useMemo(() => new Matrix3().setFromMatrix4(GAL_BASIS), []);
  const rotM31 = useMemo(() => new Matrix3().setFromMatrix4(new Matrix4().makeRotationFromQuaternion(orient(M31))), []);
  useFrame(({ size }) => {
    const s = useStore.getState(), t = s.event?.t ?? 0, { T, sep, angle } = merger(t), u = material.uniforms;
    const center = MW0.clone().lerp(M310, 0.5), off = U().multiplyScalar(Math.cos(angle)).addScaledVector(W(), Math.sin(angle)).multiplyScalar(sep / 2);
    u.uC.value[0].copy(center).sub(off);
    u.uC.value[1].copy(center).add(off);
    u.uRot.value[0] = rotMW;
    u.uRot.value[1] = rotM31;
    u.uCenter.value.copy(center);
    u.uAxis.value.copy(off).normalize();
    u.uSpin.value = T * 1.1;
    u.uTide.value = smooth(4.3, 5.0, T) * 0.9;
    u.uMerge.value = smooth(5.6, 6.5, T);
    u.uHalfH.value = size.height / 2;
    labels[0].current.position.copy(u.uC.value[0]);
    labels[1].current.position.copy(u.uC.value[1]);
  });
  const named = () => (useStore.getState().event?.t ?? 0) < 0.8;
  return (
    <>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <group ref={labels[0]}><Label id="milky-way" text="Milky Way" window={[-Infinity, -Infinity, Infinity, Infinity]} shown={named} /></group>
      <group ref={labels[1]}><Label id="andromeda" text="Andromeda" window={[-Infinity, -Infinity, Infinity, Infinity]} shown={named} /></group>
    </>
  );
}

/* ---------------------------------- Betelgeuse ---------------------------------- */

const REMNANT: CloudStep[] = [{ gen: 'remnant', opts: { count: 60_000, radius: 1, seed: 81, bright: 1.3 } }];

function Supernova() {
  const star = get(BETELGEUSE), pos = useMemo(() => star.pos(new Date()).clone().divideScalar(PC).toArray(), [star]);
  const R = star.radiusM! / PC;
  const tint = useMemo(() => starTint(3600, starColor), []);
  const material = useMemo(() => sunMaterial(tint.dark, tint.light, 0.3), [tint]);
  const body = useRef<Group>(null!), flash = useRef<Group>(null!), shell = useRef<Group>(null!);
  const remnant = useCloud(REMNANT);
  const core = useMemo(() => { const c = cloud(); c.push(0, 0, 0, 0.7, 0.85, 1, 4); return c.build(); }, []);
  useFrame(() => {
    const t = useStore.getState().event?.t ?? 0, years = snYears(t);
    // pulsing, then gone at the moment of collapse
    body.current.visible = t < SN_BANG;
    body.current.scale.setScalar(R * (1 + 0.08 * Math.sin(t * 90) * (1 - smooth(0.18, SN_BANG, t))));
    // the flash: a blinding glow that peaks just after the collapse and fades over a couple of years
    const peak = smooth(SN_BANG - 0.02, SN_BANG + 0.01, t) * (1 - smooth(SN_BANG + 0.02, SN_BANG + 0.2, t));
    flash.current.visible = peak > 0.01;
    flash.current.scale.setScalar(R * (6 + 60 * peak) + snShellPc(years) * 2);
    flash.current.children.forEach((c) => ((c as unknown as { material: { opacity: number } }).material.opacity = peak));
    shell.current.visible = t > SN_BANG;
    shell.current.scale.setScalar(Math.max(snShellPc(years), R * 2));
  });
  return (
    <group position={pos}>
      <group ref={body}><mesh material={material}><sphereGeometry args={[1, 96, 48]} /></mesh><Glow size={4} color="#ff9a5c" opacity={0.6} /></group>
      <group ref={flash}><Glow size={1} color="#ffffff" opacity={0} /><Glow size={2.2} color="#9fc4ff" opacity={0} /></group>
      <group ref={shell}>
        {remnant && <PointCloud geometry={remnant} worldSize={0.012} />}
        <PointCloud geometry={core} />
      </group>
    </group>
  );
}

/* ---------------------------------- The Sun ---------------------------------- */

const NEBULA: CloudStep[] = [{ gen: 'planetary', opts: { count: 50_000, radius: 1, seed: 82, bright: 1.2, axis: 0.85 } }];
const SUN_R_AU = 6.957e8 / AU;

function RedGiant() {
  const material = useMemo(() => sunMaterial(), []);
  const sun = useRef<Group>(null!), glow = useRef<Group>(null!), nebula = useRef<Group>(null!), dwarf = useRef<Group>(null!);
  const point = useMemo(() => { const c = cloud(); c.push(0, 0, 0, 0.8, 0.9, 1, 4); return c.build(); }, []);
  const pn = useCloud(NEBULA);
  const color = useMemo(() => new Color(), []);
  useFrame(() => {
    const s = useStore.getState(), t = s.event?.t ?? 0, { radius, temp } = sunAt(t);
    const { dark, light } = starTint(temp, starColor);
    material.uniforms.cDark.value.set(...dark);
    material.uniforms.cLight.value.set(...light);
    material.uniforms.uCells.value = 1 / (1 + 0.25 * Math.log2(Math.max(1, radius)));
    // like the real Sun in Readable mode, never smaller than a sliver of the view; the white dwarf at the end
    // keeps its true size (a fixed point of light marks it) rather than inflating into a blob
    const r = radius * SUN_R_AU, shown = s.readable && t < 0.85 ? Math.max(r, (0.005 * 10 ** s.logD) / AU) : r;
    dwarf.current.visible = t > 0.86;
    sun.current.scale.setScalar(shown);
    color.setRGB(...light);
    glow.current.children.forEach((c) => (c as unknown as { material: { color: Color } }).material.color.copy(color));
    nebula.current.visible = t > 0.85;
    nebula.current.scale.setScalar(pnRadiusAU(t));
  });
  return (
    <>
      <group ref={sun}>
        <mesh material={material}><sphereGeometry args={[1, 128, 64]} /></mesh>
        <group ref={glow}><Glow size={3} color="#ffd38a" opacity={0.7} /><Glow size={7} color="#ffd38a" opacity={0.18} /></group>
      </group>
      <group ref={nebula}>{pn && <PointCloud geometry={pn} worldSize={0.012} />}</group>
      <group ref={dwarf}><PointCloud geometry={point} /></group>
    </>
  );
}

/** The red-giant Sun's radius in AU right now (for hiding the planets it swallows), or 0. */
export const swallowedTo = () => {
  const e = useStore.getState().event;
  return e?.id === 'red-giant' ? sunReachAU(e.t) : 0;
};

export function Events() {
  const id = useStore((s) => s.event?.id);
  useEffect(() => () => endEvent(), []);
  return (
    <>
      <Controller />
      {id === 'merger' && <Space unit={KPC}><Merger /></Space>}
      {id === 'supernova' && <Space unit={PC}><Supernova /></Space>}
      {id === 'red-giant' && <Space unit={AU}><RedGiant /></Space>}
    </>
  );
}
