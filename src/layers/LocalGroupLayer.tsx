import { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import { GALAXIES, MILKY_WAY as MW, type Galaxy } from '../data/deepSky.ts';
import { LAYERS, type Fade } from '../data/layers.ts';
import { GAL_BASIS, galDir } from '../lib/coords.ts';
import { Inspectable } from '../scene/Inspectable.tsx';
import { Glow } from '../scene/Glow.tsx';
import { Fader } from '../scene/Space.tsx';
import { PointCloud, cloud } from '../scene/PointCloud.tsx';
import { addElliptical, addIrregular, addMerger, addRing, addSpiral } from '../scene/galaxy.ts';

const LAYER = LAYERS[6];
const D = Math.PI / 180;
const Z = new Vector3(0, 0, 1), UP = new Vector3(0, 1, 0);
// Point size as a fraction of galaxy diameter: ~2–3 px when zoomed in on one, sub-pixel and dimmed from afar.
const POINT = 0.004, POINT_DETAIL = 0.0016;
/** Shown within these zooms; each galaxy also stays shown while you're focused on it. */
const SHOWN: Record<Galaxy['zone'], Fade> = { local: LAYER.fade, mc: LAYER.fade, m31: LAYER.fade, far: [22.0, 22.8, 25.4, 26.0], deep: [23.0, 23.8, 25.8, 26.4] };
const LABEL: Record<Galaxy['zone'], Fade> = {
  local: LAYER.fade,
  mc: [21.0, 21.6, 22.2, 22.5], // the Magellanic Clouds crowd the Milky Way when zoomed out
  m31: [20.4, 20.9, 21.6, 21.9], // Andromeda's satellites, only when looking at Andromeda
  far: [22.6, 23.0, 24.0, 24.5],
  deep: [23.8, 24.2, 25.0, 25.5], // hundreds of millions of light-years out
};

function build(g: Galaxy, seed: number, count: number, bright: number) {
  const c = cloud(), o = { radius: g.diameterKpc / 2, seed, count, bright, ...g.opts };
  if (g.shape === 'spiral') addSpiral(c, o);
  else if (g.shape === 'elliptical') addElliptical(c, o);
  else if (g.shape === 'ring') addRing(c, o);
  else if (g.shape === 'merger') addMerger(c, o);
  else addIrregular(c, o);
  return c.build();
}

/** Disk orientation as seen from Earth: tilted `incl` away from facing us, about an axis turned by `pa`. */
function orient(g: Galaxy) {
  const toUs = galDir(g.l, g.b).negate();
  const axis = new Vector3().crossVectors(toUs, UP).normalize().applyAxisAngle(toUs, g.pa * D);
  return new Quaternion().setFromUnitVectors(Z, toUs.clone().applyAxisAngle(axis, g.incl * D));
}

function GalaxyView({ g, seed }: { g: Galaxy; seed: number }) {
  const coarseN = Math.max(1500, Math.round(g.diameterKpc * 220));
  const fineN = Math.round(Math.min(160_000, Math.max(40_000, g.diameterKpc * 4000)));
  const { pos, quat } = useMemo(() => ({ pos: galDir(g.l, g.b).multiplyScalar(g.distKpc).toArray(), quat: orient(g) }), [g]);
  return (
    <Inspectable
      id={g.id} name={g.name} window={SHOWN[g.zone]} label={LABEL[g.zone]} position={pos} quaternion={quat}
      coarse={() => build(g, seed, coarseN, 2.4)}
      // same total light, spread over more, smaller stars
      fine={() => build(g, seed, fineN, 2.4 * 2.2 * (coarseN / fineN) ** 0.5)}
      size={[g.diameterKpc * POINT, g.diameterKpc * POINT_DETAIL]}
      glow={{ size: g.diameterKpc * 0.6, color: g.shape === 'irregular' ? '#cfdcff' : '#ffe2bd' }}
    />
  );
}

export function LocalGroupLayer() {
  // A lighter Milky Way at the same point density as its neighbors (the full one fades out before here).
  const home = useMemo(() => {
    const c = cloud();
    addSpiral(c, { count: MW.diameterKpc * 220, radius: MW.diameterKpc / 2, cx: MW.sunDistKpc, seed: 3, bright: 2.4 });
    return c.build();
  }, []);
  return (
    <>
      {/* takes over as the full Milky Way layer fades out, so the two never stack */}
      <Fader window={LAYER.fade}>
        <Fader window={[LAYERS[5].fade[2], LAYERS[5].fade[3], Infinity, Infinity]}>
          <group matrix={GAL_BASIS} matrixAutoUpdate={false}>
            <PointCloud geometry={home} worldSize={MW.diameterKpc * POINT} />
            <Glow size={MW.diameterKpc * 0.5} color="#ffd8a8" opacity={0.7} position={[MW.sunDistKpc, 0, 0]} />
          </group>
        </Fader>
      </Fader>
      {GALAXIES.map((g, i) => <GalaxyView key={g.id} g={g} seed={20 + i} />)}
    </>
  );
}
