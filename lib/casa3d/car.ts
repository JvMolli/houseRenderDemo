/**
 * Citroën C3 de baja poligonización a partir de sus medidas reales (CAR en
 * parcel.ts): perfil lateral extruido con bordes redondeados para la
 * carrocería, habitáculo de cristal tintado, techo, ruedas, faros, pilotos y
 * retrovisores. Coordenadas locales: x de la trasera (0) al morro (length),
 * y hacia arriba desde el suelo, z centrada en el eje del coche.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ExtraMaterialKey } from './materials';
import { CAR } from './parcel';
import type { MaterialKey } from './plan';

type Profile = readonly (readonly [number, number])[];

function extrudeProfile(points: Profile, width: number, bevel: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(s, {
    depth: width - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3,
  });
  return g.translate(0, 0, -(width - 2 * bevel) / 2);
}

const box = (w: number, h: number, d: number, x: number, y: number, z: number) =>
  new THREE.BoxGeometry(w, h, d).translate(x, y, z);

/** Rueda con el eje en z. */
const wheel = (r: number, w: number, x: number, z: number, segments = 24) =>
  new THREE.CylinderGeometry(r, r, w, segments).rotateX(Math.PI / 2).translate(x, CAR.wheelRadius, z);

/** Geometrías del coche fusionadas por material. */
export function buildCar(): { mat: MaterialKey | ExtraMaterialKey; geometry: THREE.BufferGeometry }[] {
  const { length: L, width: W, wheelbase, wheelRadius: r } = CAR;
  const rearAxle = (L - wheelbase) / 2, frontAxle = rearAxle + wheelbase, side = W / 2;

  const body: Profile = [
    [0.06, 0.24], [L - 0.08, 0.24], [L, 0.36], [L, 0.62], [L - 0.08, 0.78], [L - 0.6, 0.9],
    [2.9, 0.98], [0.18, 1.02], [0.02, 0.96], [0, 0.45],
  ];
  const cabin: Profile = [[0.22, 1.0], [2.88, 0.97], [2.18, 1.44], [0.42, 1.46]];
  const roof: Profile = [[0.42, 1.44], [2.18, 1.42], [2.12, CAR.height], [0.48, CAR.height]];

  const parts: Record<string, THREE.BufferGeometry[]> = {
    carBody: [
      extrudeProfile(body, W, 0.06),
      box(0.12, 0.08, 0.14, 2.75, 1.03, side + 0.04), box(0.12, 0.08, 0.14, 2.75, 1.03, -side - 0.04),
    ],
    carGlass: [extrudeProfile(cabin, W - 0.14, 0.03)],
    carRoof: [extrudeProfile(roof, W - 0.1, 0.03)],
    black: [
      ...[rearAxle, frontAxle].flatMap(x => [wheel(r, 0.22, x, side - 0.1), wheel(r, 0.22, x, -side + 0.1)]),
      box(0.03, 0.14, 0.9, L - 0.005, 0.48, 0),
    ],
    steel: [rearAxle, frontAxle].flatMap(x => [wheel(0.2, 0.23, x, side - 0.1, 16), wheel(0.2, 0.23, x, -side + 0.1, 16)]),
    carLightFront: [box(0.04, 0.08, 0.36, L - 0.03, 0.7, 0.55), box(0.04, 0.08, 0.36, L - 0.03, 0.7, -0.55)],
    carLightRear: [box(0.04, 0.12, 0.3, 0.01, 0.85, 0.6), box(0.04, 0.12, 0.3, 0.01, 0.85, -0.6)],
  };

  return Object.entries(parts).map(([mat, list]) => {
    // ExtrudeGeometry no tiene índice: todo a no indexado para poder fusionar.
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
