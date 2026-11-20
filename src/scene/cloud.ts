// Point-cloud builder shared by the main thread and the cloud worker: push(x, y, z, r, g, b, sizePx, speed).
export interface Cloud {
  push(x: number, y: number, z: number, r: number, g: number, b: number, size: number, speed?: number): void;
}

export interface CloudArrays { position: Float32Array; color: Float32Array; size: Float32Array; aSpeed: Float32Array }

export function cloud() {
  const p: number[] = [], c: number[] = [], s: number[] = [], v: number[] = [];
  return {
    push(x: number, y: number, z: number, r: number, g: number, b: number, size: number, speed = 0) {
      p.push(x, y, z); c.push(r, g, b); s.push(size); v.push(speed);
    },
    arrays(): CloudArrays {
      return { position: new Float32Array(p), color: new Float32Array(c), size: new Float32Array(s), aSpeed: new Float32Array(v) };
    },
  };
}
