/**
 * Modo tour: interpolación de cámara entre paradas, sin three.
 * Viaje con aceleración y frenada suaves y un arco hacia arriba (salta por
 * encima de los tabiques al cambiar de estancia); en cada parada, un giro lento
 * alrededor del objetivo.
 */
import type { CameraView } from './plan';
import type { Vec3 } from './units';

export interface Pose { position: Vec3; target: Vec3 }

/** Segundos parado en cada sitio y giro (rad) durante la parada. */
export const TOUR_HOLD = 3.5;
export const TOUR_DRIFT = 0.14;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const smooth = (u: number) => u * u * (3 - 2 * u);
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Duración (s) y altura del arco (m) de un viaje. */
export function tourSegment(from: Pose, to: Pose) {
  const d = dist(from.position, to.position);
  return { duration: clamp(d / 4, 2.2, 5), arc: clamp(d * 0.5, 1.2, 6) };
}

/** Pose de la cámara a una fracción u (0..1) del viaje. */
export function travelPose(from: Pose, to: Pose, u: number, arc: number): Pose {
  const e = smooth(clamp(u, 0, 1));
  const position = lerp3(from.position, to.position, e);
  position[1] += Math.sin(Math.PI * e) * arc;
  return { position, target: lerp3(from.target, to.target, e) };
}

/** Pose durante la parada: la cámara gira despacio alrededor del objetivo (k = 0..1 de la parada). */
export function holdPose(stop: CameraView, k: number): Pose {
  const a = TOUR_DRIFT * smooth(clamp(k, 0, 1));
  const [px, py, pz] = stop.position, [tx, , tz] = stop.target;
  const dx = px - tx, dz = pz - tz, c = Math.cos(a), s = Math.sin(a);
  return { position: [tx + dx * c - dz * s, py, tz + dx * s + dz * c], target: stop.target };
}
