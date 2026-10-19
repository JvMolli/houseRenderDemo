/**
 * Harley-Davidson tipo cruiser (Fat Boy) de baja poligonización con medidas
 * reales: batalla 1,6 m, ruedas de 0,66 m, motor V-twin, depósito en lágrima,
 * horquilla lanzada, escapes cromados y alforjas de cuero. Coordenadas
 * locales: x hacia el morro, y hacia arriba desde el suelo, z a la derecha.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ExtraMaterialKey } from './materials';
import type { MaterialKey } from './plan';

type P3 = [number, number, number];

const R = 0.33, WB = 1.6, FRONT = WB / 2, REAR = -WB / 2;

/** Cilindro de a a b. */
function rod(a: P3, b: P3, r: number, seg = 12) {
  const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const g = new THREE.CylinderGeometry(r, r, dir.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  return g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
const ball = (c: P3, r: number, s: P3 = [1, 1, 1]) => new THREE.SphereGeometry(r, 18, 12).scale(...s).translate(...c);
const box = (s: P3, c: P3) => new THREE.BoxGeometry(...s).translate(...c);

/** Rueda en el plano XY: neumático (toro) y llanta de disco. */
const tire = (x: number) => new THREE.TorusGeometry(R - 0.07, 0.075, 12, 32).translate(x, R, 0);
const rim = (x: number) => new THREE.CylinderGeometry(R - 0.11, R - 0.11, 0.07, 28).rotateX(Math.PI / 2).translate(x, R, 0);
/** Guardabarros: arco sobre la rueda, de `from` a `to` grados. */
const fender = (x: number, from: number, to: number) =>
  new THREE.TorusGeometry(R + 0.04, 0.07, 6, 20, ((to - from) * Math.PI) / 180).scale(1, 1, 1.4)
    .rotateZ((from * Math.PI) / 180).translate(x, R, 0);

export function buildMotorcycle(): { mat: MaterialKey | ExtraMaterialKey; geometry: THREE.BufferGeometry }[] {
  const steer: P3 = [0.48, 1.0, 0]; // pipa de dirección
  const parts: Record<string, THREE.BufferGeometry[]> = {
    harleyBlue: [
      ball([0.18, 0.92, 0], 0.26, [1.15, 0.55, 0.62]), // depósito
      fender(FRONT, 20, 165),
      fender(REAR, 15, 175),
      box([0.5, 0.06, 0.16], [-0.45, 0.62, 0]), // carenado lateral bajo el asiento
    ],
    black: [
      tire(FRONT), tire(REAR),
      ball([-0.28, 0.85, 0], 0.22, [1.5, 0.35, 0.95]), // asiento
      ball([-0.58, 0.9, 0], 0.12, [1, 0.6, 0.9]), // respaldo del pasajero
      box([0.38, 0.32, 0.18], [-0.62, 0.62, 0.26]), box([0.38, 0.32, 0.18], [-0.62, 0.62, -0.26]), // alforjas
      rod([0.05, 0.42, 0], [0.45, 0.95, 0], 0.035), rod([-0.45, 0.5, 0], [0.05, 0.42, 0], 0.035), // chasis
      rod([0.62, 1.32, -0.42], [0.62, 1.32, 0.42], 0.016), // manillar
      box([0.06, 0.06, 0.1], [0.62, 1.32, 0.44]), box([0.06, 0.06, 0.1], [0.62, 1.32, -0.44]), // puños
      rod([-0.15, 0.3, -0.2], [-0.05, 0.02, -0.38], 0.012), // pata de cabra
    ],
    chrome: [
      rim(FRONT), rim(REAR),
      // Motor V-twin: cárter y dos cilindros en V con aletas
      ball([0, 0.4, 0], 0.17, [1.3, 0.9, 0.85]),
      rod([-0.02, 0.45, 0], [-0.22, 0.78, 0], 0.085, 16), rod([0.02, 0.45, 0], [0.24, 0.78, 0], 0.085, 16),
      ...[0.55, 0.62, 0.69, 0.76].flatMap(y => [
        rod([-0.12 - (y - 0.55) * 0.6, y, -0.105], [-0.12 - (y - 0.55) * 0.6, y, 0.105], 0.012),
        rod([0.13 + (y - 0.55) * 0.66, y, -0.105], [0.13 + (y - 0.55) * 0.66, y, 0.105], 0.012),
      ]),
      ball([0.07, 0.62, 0.17], 0.09, [1, 1, 0.5]), // filtro de aire
      // Horquilla lanzada
      rod([FRONT, R, 0.09], [steer[0], steer[1] + 0.22, 0.09], 0.028), rod([FRONT, R, -0.09], [steer[0], steer[1] + 0.22, -0.09], 0.028),
      ball([0.66, 1.08, 0], 0.11, [0.7, 1, 1]), // faro
      rod([0.55, 1.22, 0.12], [0.62, 1.32, 0.12], 0.015), rod([0.55, 1.22, -0.12], [0.62, 1.32, -0.12], 0.015), // elevadores
      // Escapes dobles por la derecha
      rod([0.18, 0.62, 0.12], [0.05, 0.3, 0.24], 0.032), rod([-0.12, 0.62, 0.12], [-0.2, 0.3, 0.24], 0.032),
      rod([0.05, 0.3, 0.24], [-1.05, 0.38, 0.24], 0.04), rod([-0.2, 0.3, 0.24], [-1.0, 0.48, 0.26], 0.04),
      rod([0.05, 0.42, 0.18], [-0.45, 0.62, 0.12], 0.015), // amortiguador
      rod([0.2, 0.2, -0.24], [0.2, 0.2, 0.24], 0.012), // estribos
    ],
    carLightRear: [box([0.03, 0.05, 0.12], [-1.12, 0.78, 0])],
  };
  return Object.entries(parts).map(([mat, list]) => {
    const flat = list.map(g => {
      const n = g.index ? g.toNonIndexed() : g;
      n.clearGroups();
      return n;
    });
    const geometry = mergeGeometries(flat);
    for (const g of [...list, ...flat]) if (g !== geometry) g.dispose();
    return { mat: mat as MaterialKey | ExtraMaterialKey, geometry };
  });
}
