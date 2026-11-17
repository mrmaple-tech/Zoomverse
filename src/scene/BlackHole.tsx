// Sagittarius A*, ray-traced. Every pixel's light path is integrated through the curved space around
// the hole (the integrator in lib/geodesic.ts). Along the way the ray picks up the glowing accretion
// disk each time it crosses the disk plane, and where it finally escapes it shows whatever part of the
// real scene lies in that direction. So the far side of the disk arches over the shadow and the stars
// behind smear into an Einstein ring because the light paths bend, not because anything is painted on.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BackSide, CubeCamera, HalfFloatType, Matrix4, ShaderMaterial, Vector2, Vector3,
  WebGLCubeRenderTarget, WebGLRenderTarget, type Group, type Mesh, type Points,
} from 'three';
import { SGR_A } from '../data/deepSky.ts';
import { get } from '../catalog.ts';
import { galDir, gauss, rng } from '../lib/coords.ts';
import { MAX_STEPS, STEP } from '../lib/geodesic.ts';
import { starColor } from '../lib/stars.ts';
import { useStore } from '../store.ts';
import { Label } from './Label.tsx';
import { pointsMaterial } from './materials.ts';
import { cloud } from './PointCloud.tsx';
import { K } from './Space.tsx';

const RS = SGR_A.horizonKm * 1e3;
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
    uCam: { value: new Vector3() }, uCenter: { value: new Vector3() }, uRs: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 1 },
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
    uniform vec3 uCam, uCenter; uniform float uRs, uTime, uOpacity;
    varying vec3 vW;
    const float LENS = ${f(LENS)}, STEP = ${f(STEP)}, SKY_R = ${f(SKY_R)};
    const float R_IN = 3.0, R_OUT = 13.0;   // innermost stable orbit, and where the disk thins out
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
      float w = SPIN * pow(r, -1.5), w0 = SPIN * pow(R_OUT, -1.5), n = 0.0;
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
      if (r <= R_IN || r >= R_OUT) return vec4(0.0);
      // thin-disk brightness profile: zero at the inner edge, peaking just outside it (normalized to 1)
      float flux = 476.0 * (1.0 - sqrt(R_IN / r)) / (r * r * r);
      // gas on circular orbits, at the speed an observer hovering there would measure: half the speed of light at the inner edge
      float beta = sqrt(0.5 / (r - 1.0));
      vec3 er = vec3(x.x, 0.0, x.z) / r, et = vec3(-er.z, 0.0, er.x);
      vec3 k = -v; k = normalize(k + er * dot(k, er) * (1.0 / sqrt(1.0 - 1.0 / r) - 1.0));
      // how much the light's frequency is shifted on the way to us: Doppler (the side coming toward us
      // is bluer and far brighter) times the climb out of the gravity well
      float g = shift * sqrt(1.0 - 1.5 / r) / (1.0 - beta * dot(et, k));
      float n = gas(r, atan(x.z, x.x));
      vec3 col = blackbody(4300.0 * pow(flux, 0.25) * g) * flux * g * g * g * g * (0.5 + 3.2 * n * n);
      float a = smoothstep(R_IN, R_IN + 0.5, r) * smoothstep(R_OUT, R_OUT - 5.0, r) * (0.55 + 0.45 * n);
      return vec4(col * 1.5 * a, a);
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
          if (p.y * q.y < 0.0 && lit.a < 0.995) lit += (1.0 - lit.a) * disk(mix(p, q, p.y / (p.y - q.y)), v, 1.0 / well);
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

/** The packed sky of the galaxy's core: old orange giants everywhere, a few young blue stars, thicker along the disk. */
function coreSky() {
  const c = cloud(), r = rng(11);
  for (let i = 0; i < 9000; i++) {
    const dir = r() < 0.45 ? galDir(r() * 360, gauss(r) * 9) : new Vector3(gauss(r), gauss(r), gauss(r)).normalize();
    const [cr, cg, cb] = starColor(r() < 0.12 ? 9000 + r() * 16000 : 3200 + r() * 2200);
    const k = 0.15 + r() ** 3 * 0.75;
    dir.multiplyScalar(SKY_R - 30 + r() * 60);
    c.push(dir.x, dir.y, dir.z, cr * k, cg * k, cb * k, 1.6 + r() ** 3 * 3);
  }
  return c.build();
}

export function BlackHole() {
  const mesh = useRef<Mesh>(null!), label = useRef<Group>(null!), stars = useRef<Points>(null!);
  const g = useMemo(() => {
    // drawn like every other shader here; the tone mapping lines make it match drei's <Stars> when it is re-photographed below
    const skyMat = pointsMaterial(0);
    skyMat.fragmentShader = skyMat.fragmentShader.replace(/\}\s*$/, '#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}');
    const cube = new WebGLCubeRenderTarget(512, { type: HalfFloatType });
    return {
      mat: material(), skyMat, skyGeo: coreSky(), cube, cubeCam: new CubeCamera(1, 2000, cube),
      shot: new WebGLRenderTarget(1, 1, { type: HalfFloatType }),
      center: new Vector3(), size: new Vector2(), frame: 0,
    };
  }, []);
  useEffect(() => () => { g.shot.dispose(); g.cube.dispose(); g.mat.dispose(); g.skyMat.dispose(); g.skyGeo.dispose(); }, [g]);

  useFrame(({ gl, scene, camera }, dt) => {
    const s = useStore.getState(), k = K / 10 ** s.logD, u = g.mat.uniforms;
    const pos = get(SGR_A.id).pos(new Date(0));
    g.center.copy(pos).sub(s.focus).multiplyScalar(k);
    label.current.position.copy(g.center);

    // the crowded sky only exists within a few light-years of the center
    const near = 1 - smooth(16, 17, Math.log10(pos.distanceTo(s.focus) + 10 ** s.logD));
    g.skyMat.uniforms.uOpacity.value = near;
    stars.current.visible = near > 0.003;

    // skip the whole thing until the lens is more than a few pixels across
    const rs = RS * k, o = smooth(0.004, 0.012, (LENS * rs) / camera.position.distanceTo(g.center));
    mesh.current.visible = o > 0;
    if (!o) return;
    mesh.current.position.copy(g.center);
    mesh.current.scale.setScalar(LENS * rs * 1.08); // the faceted ball must contain the true sphere
    u.uOpacity.value = o;
    u.uRs.value = rs;
    u.uCenter.value.copy(g.center);
    u.uCam.value.copy(camera.position).sub(g.center).divideScalar(rs);
    u.uProj.value = camera.projectionMatrix;
    if (s.playing && !reducedMotion) u.uTime.value += Math.min(dt, 0.1);

    // Photograph the scene without the hole: once through the camera (every frame), and now and then
    // in all six directions from the hole for light that arrives from off screen.
    gl.getDrawingBufferSize(g.size);
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

  return (
    <>
      <points ref={stars} geometry={g.skyGeo} material={g.skyMat} visible={false} />
      <mesh ref={mesh} material={g.mat} visible={false} renderOrder={10}>
        <icosahedronGeometry args={[1, 3]} />
      </mesh>
      <group ref={label}>
        {/* named on the way in, then out of the way once the hole itself fills the view */}
        <Label id={SGR_A.id} text="Sagittarius A*" window={[18.4, 19, 19.5, 19.9]} shown={() => useStore.getState().logD > 12.4} />
      </group>
    </>
  );
}
