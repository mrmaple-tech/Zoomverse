// Ask the cloud worker for a point cloud; the hook returns null until it's ready (usually a few frames).
import { useEffect, useState } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import type { CloudArrays } from './cloud.ts';

export type CloudStep = { gen: string; opts: Record<string, number> };

let worker: Worker | undefined;
let nextId = 0;
const waiting = new Map<number, (g: BufferGeometry) => void>();
const cache = new Map<string, Promise<BufferGeometry>>();

export function toGeometry({ position, color, size, aSpeed }: CloudArrays) {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(position, 3));
  geo.setAttribute('color', new BufferAttribute(color, 3));
  geo.setAttribute('size', new BufferAttribute(size, 1));
  geo.setAttribute('aSpeed', new BufferAttribute(aSpeed, 1));
  return geo;
}

function request(steps: CloudStep[], key: string) {
  let p = cache.get(key);
  if (p) return p;
  if (!worker) {
    worker = new Worker(new URL('./cloudWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<CloudArrays & { id: number }>) => {
      waiting.get(data.id)?.(toGeometry(data));
      waiting.delete(data.id);
    };
  }
  p = new Promise<BufferGeometry>((resolve) => {
    const id = nextId++;
    waiting.set(id, resolve);
    worker!.postMessage({ id, steps });
  });
  cache.set(key, p); // same recipe, same cloud: revisits are instant
  return p;
}

export function useCloud(steps: CloudStep[] | null) {
  const key = steps ? JSON.stringify(steps) : '';
  const [geo, setGeo] = useState<{ key: string; g: BufferGeometry } | null>(null);
  useEffect(() => {
    if (!steps) return;
    let live = true;
    request(steps, key).then((g) => live && setGeo({ key, g }));
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return geo && geo.key === key ? geo.g : null;
}
