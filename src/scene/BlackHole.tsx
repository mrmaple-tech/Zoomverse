// Black holes, ray-traced (Sagittarius A* and the others in BLACK_HOLES). Every pixel's light path is integrated through the curved space around
// the hole (the integrator in lib/geodesic.ts). Along the way the ray picks up the glowing accretion
// disk each time it crosses the disk plane, and where it finally escapes it shows whatever part of the
// real scene lies in that direction. So the far side of the disk arches over the shadow and the stars
// behind smear into an Einstein ring because the light paths bend, not because anything is painted on.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, CubeCamera, DoubleSide, Float32BufferAttribute, HalfFloatType,
  Matrix4, ShaderMaterial, Vector2, Vector3, WebGLCubeRenderTarget, WebGLRenderTarget, type Group, type Mesh, type Points,
} from 'three';
import { BLACK_HOLES, GALAXIES, SGR_A, horizonM, type BlackHoleInfo } from '../data/deepSky.ts';
import type { Fade } from '../data/layers.ts';
import { get } from '../catalog.ts';
import { KPC, galDir } from '../lib/coords.ts';
import { gauss, rng } from '../lib/random.ts';
import { MAX_STEPS, STEP } from '../lib/geodesic.ts';
import { starColor } from '../lib/stars.ts';
import { useStore } from '../store.ts';
import { Label } from './Label.tsx';
import { pointsMaterial, pxRatio, starSurface } from './materials.ts';
import { Glow } from './Glow.tsx';
import { MOBILE } from '../lib/device.ts';
import { cloud } from './PointCloud.tsx';
import { K } from './Space.tsx';

/** Space is treated as flat beyond this many horizon radii, where light bends by under 2°. */
const LENS = 50;
/** The background stars sit on a shell about this far from the scene origin (drei's <Stars> and ours). */
const SKY_R = 330;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const f = (n: number) => n.toFixed(4);
const material = () => new ShaderMaterial({
  transparent: true, depthTest: false, depthWrite: false, side: BackSide,
  uniforms: {
    uScene: { value: null }, uSky: { value: null }, uProj: { value: new Matrix4() },
    uCam: { value: new Vector3() }, uCenter: { value: new Vector3() }, uRs: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 1 }, uDisk: { value: 1 }, uTemp: { value: 4300 }, uRout: { value: 13 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vW;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  // Rays are traced with the hole at the origin and lengths in horizon radii; the disk lies in the XZ plane.
  fragmentShader: /* glsl */ `
    uniform sampler2D uScene; uniform samplerCube uSky; uniform mat4 uProj;
    uniform vec3 uCam, uCenter; uniform float uRs, uTime, uOpacity, uDisk, uTemp, uRout;
    varying vec3 vW;
    const float LENS = ${f(LENS)}, STEP = ${f(STEP)}, SKY_R = ${f(SKY_R)};
    const float R_IN = 3.0;   // innermost stable orbit; the disk thins out by uRout
    const float SPIN = 1.3, CYCLE = 12.0;

    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    // value noise that wraps around in x every \`per\` cells
    float vnoise(vec2 p, float per) {
      vec2 i = floor(p), u = fract(p); u = u * u * (3.0 - 2.0 * u);
      float x0 = mod(i.x, per), x1 = mod(i.x + 1.0, per);
      return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), u.x), mix(hash(vec2(x0, i.y + 1.0)), hash(vec2(x1, i.y + 1.0)), u.x), u.y);
    }
    // Streaks of gas. Inner orbits are faster, which would wind any pattern ever tighter, so two copies
    // each shear for one cycle and cross-fade into a fresh one.
    float gas(float r, float phi) {
      float w = SPIN * pow(r, -1.5), w0 = SPIN * pow(uRout, -1.5), n = 0.0;
      for (int k = 0; k < 2; k++) {
        float c = uTime / CYCLE + 0.5 * float(k), ph = fract(c);
        float a = fract((phi - w0 * uTime - (w - w0) * (ph - 0.5) * CYCLE) / 6.28318);
        float seed = floor(c) * 7.0 + float(k) * 3.0;
        n += (0.6 * vnoise(vec2(a * 12.0, r * 1.6 + seed), 12.0) + 0.4 * vnoise(vec2(a * 36.0, r * 4.5 + seed), 36.0)) * (1.0 - abs(2.0 * ph - 1.0));
      }
      return n;
    }
    // color of a glowing body at temperature T (kelvin), linear RGB
    vec3 blackbody(float T) {
      float t = clamp(T, 1000.0, 40000.0) / 100.0;
      vec3 c = t <= 66.0
        ? vec3(1.0, 0.39008 * log(t) - 0.63184, t <= 19.0 ? 0.0 : 0.54321 * log(t - 10.0) - 1.19625)
        : vec3(1.29294 * pow(t - 60.0, -0.1332), 1.12989 * pow(t - 60.0, -0.07551), 1.0);
      c = clamp(c, 0.0, 1.0);
      return c * c;
    }
    // Light from the disk where a ray (travelling along v, away from the camera) crosses it at x.
    vec4 disk(vec3 x, vec3 v, float shift) {
      float r = length(x.xz);
      if (r <= R_IN || r >= uRout) return vec4(0.0);
      // thin-disk brightness profile: zero at the inner edge, peaking just outside it (normalized to 1)
      float flux = 476.0 * (1.0 - sqrt(R_IN / r)) / (r * r * r);
      // gas on circular orbits, at the speed an observer hovering there would measure: half the speed of light at the inner edge
      float beta = sqrt(0.5 / (r - 1.0));
      vec3 er = vec3(x.x, 0.0, x.z) / r, et = vec3(-er.z, 0.0, er.x);
      vec3 k = -v; k = normalize(k + er * dot(k, er) * (1.0 / sqrt(1.0 - 1.0 / r) - 1.0));
      // how much the light's frequency is shifted on the way to us: Doppler (the side coming toward us
      // is bluer and far brighter) times the climb out of the gravity well
      float g = shift * sqrt(1.0 - 1.5 / r) / (1.0 - beta * dot(et, k));
      float phi = atan(x.z, x.x), n = gas(r, phi);
      // a hot spot riding the inner disk, like the flares seen circling Sagittarius A*
      float rh = R_IN + 1.6, ph = mod(SPIN * pow(rh, -1.5) * uTime, 6.28318);
      n += 1.4 * exp(-(r * r + rh * rh - 2.0 * r * rh * cos(phi - ph)) / 0.5);
      vec3 col = blackbody(uTemp * pow(flux, 0.25) * g) * flux * g * g * g * g * (0.5 + 3.2 * n * n);
      float a = smoothstep(R_IN, R_IN + 0.5, r) * smoothstep(uRout, uRout - 5.0, r) * (0.55 + 0.45 * n) * min(uDisk, 1.0);
      return vec4(col * 1.5 * a * max(uDisk, 1.0), a);
    }
    // The real scene in the direction a ray leaves along. On screen that is this frame's own picture;
    // rays bent off the edge of the screen (or back past the camera) use the all-around capture.
    vec3 sky(vec3 p, vec3 v) {
      vec3 q = p * uRs + normalize(v) * SKY_R;   // where the ray meets the star shell, from the hole
      vec3 all = textureCube(uSky, q).rgb;
      vec4 clip = uProj * viewMatrix * vec4(uCenter + q, 1.0);
      if (clip.w <= 0.0) return all;
      vec2 uv = clip.xy / clip.w * 0.5 + 0.5, e = min(uv, 1.0 - uv);
      return mix(all, texture2D(uScene, clamp(uv, 0.0, 1.0)).rgb, smoothstep(0.0, 0.03, min(e.x, e.y)));
    }

    void main() {
      vec3 p = uCam, v = normalize(vW - cameraPosition);
      float r0 = length(p), well = 1.0;
      if (r0 < LENS) {
        // a hovering observer's rulers are stretched radially, which changes the angles they see
        well = sqrt(max(1.0 - 1.0 / r0, 0.0) / (1.0 - 1.0 / LENS));
        vec3 er = p / r0;
        v = normalize(v + er * dot(v, er) * (well - 1.0));
      } else {
        // fly straight to the edge of the lens
        float b = dot(p, v), disc = b * b - r0 * r0 + LENS * LENS;
        p += v * (disc > 0.0 && b < 0.0 ? -b - sqrt(disc) : 0.0);
      }
      vec4 lit = vec4(0.0);   // disk light gathered so far (premultiplied) and how much it blocks
      bool escaped = dot(p, p) > LENS * LENS * 1.0001;
      bool done = escaped;
      if (!done) {
        vec3 h = cross(p, v); float h2 = dot(h, h);
        vec3 a = -1.5 * h2 * p / pow(dot(p, p), 2.5);
        for (int i = 0; i < ${MAX_STEPS}; i++) {
          float r2 = dot(p, p);
          if (r2 < 1.0) { done = true; break; }                                             // through the horizon
          if (r2 > LENS * LENS * 1.0001 && dot(p, v) > 0.0) { done = escaped = true; break; }
          float dt = STEP * sqrt(r2);
          v += a * (dt * 0.5);
          vec3 q = p + v * dt;
          if (uDisk > 0.0 && p.y * q.y < 0.0 && lit.a < 0.995) lit += (1.0 - lit.a) * disk(mix(p, q, p.y / (p.y - q.y)), v, 1.0 / well);
          // hot, thin gas puffed above and below the disk: a soft glow the rays pass through
          if (uDisk > 0.0) {
            float rr = length(p.xz), hz = exp(-abs(p.y) / (0.35 + 0.12 * rr)) * smoothstep(2.0, R_IN + 1.0, rr) * smoothstep(uRout * 1.4, uRout * 0.4, rr) / (rr * rr);
            lit.rgb += (1.0 - lit.a) * blackbody(uTemp * 0.9) * hz * uDisk * dt * 1.6;
          }
          p = q;
          a = -1.5 * h2 * p / pow(dot(p, p), 2.5);
          v += a * (dt * 0.5);
        }
      }
      // rays that never left are circling the photon sphere and end up inside: black
      vec3 col = lit.rgb + (escaped ? (1.0 - lit.a) * sky(p, v) : vec3(0.0));
      gl_FragColor = vec4(col, uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
});

/**
 * The packed sky around the hole: a galactic core (old orange giants, a few young blue stars, thicker
 * along the disk) or a globular cluster (old yellow stars on every side, a sprinkling of blue stragglers).
 */
function crowdedSky(kind: 'core' | 'globular') {
  const c = cloud(), r = rng(kind === 'core' ? 11 : 12), n = kind === 'core' ? 9000 : 14000;
  for (let i = 0; i < n; i++) {
    const dir = kind === 'core' && r() < 0.45 ? galDir(r() * 360, gauss(r) * 9) : new Vector3(gauss(r), gauss(r), gauss(r)).normalize();
    const hot = r() < (kind === 'core' ? 0.12 : 0.03);
    const [cr, cg, cb] = starColor(hot ? 9000 + r() * 16000 : kind === 'core' ? 3200 + r() * 2200 : 4200 + r() * 1800);
    const k = (0.15 + r() ** 3 * 0.75) * (kind === 'core' ? 1 : 1.2);
    dir.multiplyScalar(SKY_R - 30 + r() * 60);
    c.push(dir.x, dir.y, dir.z, cr * k, cg * k, cb * k, 1.6 + r() ** 3 * 3);
  }
  return c.build();
}

/**
 * Twin relativistic jets along the spin axis (the disk's normal, +y), in horizon radii: widening as they
 * go, brightest along their edges (as M87's is), with knots streaming outward. The jet aimed our way is
 * boosted; the counter-jet is faint. Being ordinary scene objects, they get lensed with everything else.
 */
const JET_LEN = 2e5;
function jetGeometry() {
  const rings = 64, seg = 28, pos: number[] = [], nrm: number[] = [], along: number[] = [], idx: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, y = 2.5 * (JET_LEN / 2.5) ** t, w = 0.25 + 0.22 * y ** 0.62; // log-spaced rings, parabolic widening
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
      pos.push(cx * w, y, cz * w); nrm.push(cx, 0, cz); along.push(t);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + seg + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('aAlong', new Float32BufferAttribute(along, 1));
  g.setIndex(idx);
  return g;
}
const jetMaterial = (strength: number, time: { value: number }) => new ShaderMaterial({
  transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
  uniforms: { uTime: time, uStrength: { value: strength }, uOpacity: { value: 1 } },
  vertexShader: /* glsl */ `
    attribute float aAlong; varying float vT; varying vec3 vN; varying vec3 vW;
    void main() {
      vT = aAlong; vN = normalize(mat3(modelMatrix) * normal);
      vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uTime, uStrength, uOpacity; varying float vT; varying vec3 vN; varying vec3 vW;
    void main() {
      float edge = 1.0 - abs(dot(normalize(vN), normalize(cameraPosition - vW)));
      float limb = 0.25 + 0.75 * edge * edge;                       // limb-brightened, like a hollow sheath
      float knots = 0.55 + 0.45 * sin(vT * 70.0 - uTime * 2.5);      // blobs flowing outward
      float fall = pow(1.0 - vT, 2.2) * smoothstep(0.0, 0.03, vT);
      vec3 col = mix(vec3(0.45, 0.62, 1.0), vec3(0.9, 0.95, 1.0), pow(1.0 - vT, 8.0)); // white-hot at the base
      gl_FragColor = vec4(col * 2.4, limb * knots * fall * uStrength * uOpacity);
    }`,
});

/** Gas pulled off the companion at the point between the two, trailing as it spirals down to the disk's rim. */
const streamMaterial = (time: { value: number }) => new ShaderMaterial({
  transparent: true, depthWrite: false, blending: AdditiveBlending,
  uniforms: { uTime: time, uTheta: { value: 0 }, uD: { value: 1 }, uRout: { value: 10 }, uOpacity: { value: 1 }, uPx: pxRatio },
  vertexShader: /* glsl */ `
    attribute float aS; attribute vec2 aJit; uniform float uTime, uTheta, uD, uRout, uPx; varying float vA; varying float vS;
    void main() {
      float s = fract(aS + uTime * 0.06);                  // flowing inward, endlessly
      float r = uRout + (uD - uRout) * pow(1.0 - s, 1.6);  // spread along the whole fall, not bunched at the hole
      float a = uTheta - s * 1.4;                          // left behind as the star moves on
      vec3 p = vec3(cos(a) * r, 0.0, sin(a) * r) + vec3(aJit.x, aJit.y * 0.4, aJit.x * 0.6) * r * 0.03;
      vS = s; vA = smoothstep(0.0, 0.05, s) * (1.0 - smoothstep(0.85, 1.0, s));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (2.5 + 2.0 * s) * uPx;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uOpacity; varying float vA; varying float vS;
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      vec3 col = mix(vec3(1.0, 0.55, 0.3), vec3(0.85, 0.9, 1.0), vS); // heating up as it falls
      gl_FragColor = vec4(col * 1.3, vA * (1.0 - r * r) * 0.85 * uOpacity);
    }`,
});
function streamGeometry() {
  const r = rng(5), n = 2500, s = new Float32Array(n), jit = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { s[i] = r(); jit[i * 2] = gauss(r); jit[i * 2 + 1] = gauss(r); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3)); // placed in the shader
  g.setAttribute('aS', new BufferAttribute(s, 1));
  g.setAttribute('aJit', new BufferAttribute(jit, 2));
  return g;
}

interface Props {
  id: string;
  /** Event-horizon radius, meters. */
  rs: number;
  info?: BlackHoleInfo;
  /** The packed stars all around (Sagittarius A*'s galactic core, Omega Centauri's cluster). */
  crowd?: 'core' | 'globular';
}

const SUN_R = 6.957e8, AU_M = 1.495978707e11;

/** One ray-traced black hole. Costly (it re-renders the scene behind it), so others mount only while visited. */
export function BlackHole({ id, rs: RS, info, crowd }: Props) {
  const mesh = useRef<Mesh>(null!), stars = useRef<Points>(null!), jets = useRef<Group>(null!);
  const star = useRef<Group>(null!), stream = useRef<Points>(null!);
  const disk = info ? info.disk : 1, comp = info?.companion;
  const g = useMemo(() => {
    // drawn like every other shader here; the tone mapping lines make it match drei's <Stars> when it is re-photographed below
    const skyMat = pointsMaterial(0);
    skyMat.fragmentShader = skyMat.fragmentShader.replace(/\}\s*$/, '#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}');
    const cube = new WebGLCubeRenderTarget(MOBILE ? 256 : 512, { type: HalfFloatType });
    const mat = material();
    const look = comp ? starSurface(comp.tempK, comp.radiusSun, starColor) : null;
    return {
      mat, skyMat, skyGeo: crowd ? crowdedSky(crowd) : null, cube, cubeCam: new CubeCamera(1, 2000, cube),
      shot: new WebGLRenderTarget(1, 1, { type: HalfFloatType }),
      center: new Vector3(), size: new Vector2(), frame: 0,
      jetGeo: info?.jet ? jetGeometry() : null,
      jetMat: info?.jet ? jetMaterial(info.jet, mat.uniforms.uTime) : null,
      counterMat: info?.jet ? jetMaterial(info.jet * 0.2, mat.uniforms.uTime) : null,
      starMat: look?.material ?? null,
      starColor: look?.glow ?? '#fff',
      streamGeo: comp?.stream ? streamGeometry() : null,
      streamMat: comp?.stream ? streamMaterial(mat.uniforms.uTime) : null,
    };
  }, []);
  useEffect(() => () => {
    g.shot.dispose(); g.cube.dispose(); g.mat.dispose(); g.skyMat.dispose(); g.skyGeo?.dispose();
    g.jetGeo?.dispose(); g.jetMat?.dispose(); g.counterMat?.dispose(); g.starMat?.dispose(); g.streamGeo?.dispose(); g.streamMat?.dispose();
  }, [g]);

  useFrame(({ gl, scene, camera }, dt) => {
    const s = useStore.getState(), k = K / 10 ** s.logD, u = g.mat.uniforms;
    const pos = get(id).pos(new Date(0));
    g.center.copy(pos).sub(s.focus).multiplyScalar(k);
    const rs = RS * k;
    u.uDisk.value = disk;
    u.uTemp.value = info?.temp ?? 4300;
    u.uRout.value = info?.rOut ?? 13;
    if (s.playing && !reducedMotion) u.uTime.value += Math.min(dt, 0.1);

    if (jets.current) { jets.current.position.copy(g.center); jets.current.scale.setScalar(rs); }
    if (comp && star.current) {
      // the companion on its orbit (in the disk's plane, which its gas feeds), moving with simulation time
      const th = (2 * Math.PI * s.simTime) / (comp.periodDays * 864e5), d = comp.distAU * AU_M * k;
      star.current.position.set(g.center.x + Math.cos(th) * d, g.center.y, g.center.z + Math.sin(th) * d);
      star.current.scale.setScalar(comp.radiusSun * SUN_R * k);
      if (stream.current && g.streamMat) {
        stream.current.position.copy(g.center);
        stream.current.scale.setScalar(rs);
        const su = g.streamMat.uniforms;
        su.uTheta.value = th;
        su.uD.value = (comp.distAU * AU_M - comp.radiusSun * SUN_R) / RS; // from the near side of the star
        su.uRout.value = (info?.rOut ?? 13) * 0.9;
      }
    }

    // the crowded sky only exists close in (a few light-years at a galaxy's core, the cluster's core here)
    const lim = crowd === 'globular' ? 17.3 : 16;
    const near = crowd ? 1 - smooth(lim, lim + 1, Math.log10(pos.distanceTo(s.focus) + 10 ** s.logD)) : 0;
    g.skyMat.uniforms.uOpacity.value = near;
    if (stars.current) stars.current.visible = near > 0.003;

    // skip the whole thing until the lens is more than a few pixels across
    const o = smooth(0.004, 0.012, (LENS * rs) / camera.position.distanceTo(g.center));
    mesh.current.visible = o > 0;
    if (!o) return;
    mesh.current.position.copy(g.center);
    mesh.current.scale.setScalar(LENS * rs * 1.08); // the faceted ball must contain the true sphere
    u.uOpacity.value = o;
    u.uRs.value = rs;
    u.uCenter.value.copy(g.center);
    u.uCam.value.copy(camera.position).sub(g.center).divideScalar(rs);
    u.uProj.value = camera.projectionMatrix;

    // Photograph the scene without the hole: once through the camera (every frame), and now and then
    // in all six directions from the hole for light that arrives from off screen.
    gl.getDrawingBufferSize(g.size);
    if (MOBILE) g.size.multiplyScalar(0.5); // the photo behind the lens can be softer on a phone
    if (g.shot.width !== g.size.x || g.shot.height !== g.size.y) g.shot.setSize(g.size.x, g.size.y);
    const target = gl.getRenderTarget();
    mesh.current.visible = false;
    gl.setRenderTarget(g.shot);
    gl.render(scene, camera);
    if (g.frame++ % 20 === 0) {
      g.cubeCam.position.copy(g.center);
      g.cubeCam.update(gl, scene);
    }
    gl.setRenderTarget(target);
    mesh.current.visible = true;
    u.uScene.value = g.shot.texture;
    u.uSky.value = g.cube.texture;
  });

  // the companion's label shows once you've zoomed out far enough to see the pair
  const compWin: Fade | null = comp ? [Math.log10(comp.distAU * AU_M * 0.3), Math.log10(comp.distAU * AU_M * 0.8), Math.log10(comp.distAU * AU_M * 40), Math.log10(comp.distAU * AU_M * 80)] : null;
  return (
    <>
      {g.skyGeo && <points ref={stars} geometry={g.skyGeo} material={g.skyMat} visible={false} />}
      {g.jetGeo && (
        <group ref={jets}>
          <mesh geometry={g.jetGeo} material={g.jetMat!} />
          <mesh geometry={g.jetGeo} material={g.counterMat!} scale={[1, -1, 1]} />
        </group>
      )}
      {comp && (
        <group ref={star}>
          <mesh material={g.starMat!}><sphereGeometry args={[1, 96, 48]} /></mesh>
          <Glow size={5} color={g.starColor} opacity={0.8} />
          <Glow size={10} color={g.starColor} opacity={0.2} />
          <Label id={id} text={comp.name} window={compWin!} variant="faint" />
        </group>
      )}
      {/* placed in the shader, so three.js can't know its bounds: never cull it */}
      {g.streamGeo && <points ref={stream} geometry={g.streamGeo} material={g.streamMat!} frustumCulled={false} />}
      <mesh ref={mesh} material={g.mat} visible={false} renderOrder={10}>
        <icosahedronGeometry args={[1, 3]} />
      </mesh>
    </>
  );
}

/** A "Black hole" marker that follows a black hole through the floating origin. */
function Marker({ id, window, near }: { id: string; window: Fade; near: number }) {
  const ref = useRef<Group>(null!);
  useFrame(() => {
    const s = useStore.getState();
    ref.current.position.copy(get(id).pos(new Date(0))).sub(s.focus).multiplyScalar(K / 10 ** s.logD);
  });
  // out of the way once the hole itself fills the view
  return <group ref={ref}><Label id={id} text={id === SGR_A.id ? 'Black hole' : get(id).name} variant="marker" window={window} shown={() => useStore.getState().logD > near && !useStore.getState().event} /></group>;
}

/** Visited black hole: the one you're at or flying to (Sagittarius A* is always there). */
function Visited() {
  const at = useStore((s) => {
    const f = s.flight?.to ?? s.focusId;
    return BLACK_HOLES.find((h) => h.id === f) ?? null;
  });
  return at ? <BlackHole key={at.id} id={at.id} rs={horizonM(at.solarMasses)} info={at} crowd={at.sky} /> : null;
}

export function BlackHoles() {
  return (
    <>
      <BlackHole id={SGR_A.id} rs={SGR_A.horizonKm * 1e3} crowd="core" />
      <Visited />
      {/* marked from the edge of the galaxy inward */}
      <Marker id={SGR_A.id} window={[12.4, 13, 21.6, 22.2]} near={12.4} />
      {BLACK_HOLES.map((h) => {
        const rs = horizonM(h.solarMasses), host = GALAXIES.find((x) => x.id === h.host);
        // galaxy holes show while you look at their galaxy, stellar ones around the nearby-stars scale,
        // TON 618 out on the cosmic web
        const top = host ? Math.log10(host.diameterKpc * KPC * 1.5) : h.markTo ?? 18;
        return <Marker key={h.id} id={h.id} window={[Math.log10(rs * 40), Math.log10(rs * 80), top, top + 0.5]} near={Math.log10(rs * 30)} />;
      })}
    </>
  );
}
