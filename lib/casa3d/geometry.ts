/**
 * Geometrías de three a partir de los sólidos del plano.
 * Las piezas estáticas se fusionan por material: una malla por material y
 * grupo en lugar de una por caja, con las mismas UV y la misma forma.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { MaterialKey, Pt } from './plan';
import type { Solid } from './shapes';
import { X, Z } from './units';

export function solidGeometry(s: Solid): THREE.BufferGeometry {
  const g = s.kind === 'box' ? new THREE.BoxGeometry(...s.size) : new THREE.CylinderGeometry(s.r, s.r, s.h, 24);
  if (s.kind === 'box' && s.rotationY) g.rotateY(s.rotationY);
  return g.translate(...s.position);
}

/** Fusiona los sólidos de cada material en una sola geometría. */
export function mergeByMaterial(solids: readonly Solid[]): { mat: MaterialKey; geometry: THREE.BufferGeometry }[] {
  const groups = new Map<MaterialKey, THREE.BufferGeometry[]>();
  for (const s of solids) {
    const list = groups.get(s.mat) ?? [];
    list.push(solidGeometry(s));
    groups.set(s.mat, list);
  }
  return [...groups].map(([mat, parts]) => {
    const geometry = mergeGeometries(parts);
    for (const p of parts) p.dispose();
    return { mat, geometry };
  });
}

/** shp(): contorno del plano como Shape, en metros con y = -Z para tumbarlo en el suelo. Admite huecos. */
export function planShape(pts: readonly Pt[], holes: readonly (readonly Pt[])[] = []): THREE.Shape {
  const s = new THREE.Shape();
  pts.forEach(([px, pz], i) => {
    const a = X(px), b = -Z(pz);
    if (i) s.lineTo(a, b); else s.moveTo(a, b);
  });
  s.holes = holes.map(h => planShape(h));
  return s;
}

/** Rectángulo en px del plano como contorno. */
export const rectPoints = ([x1, z1, x2, z2]: readonly [number, number, number, number]): Pt[] =>
  [[x1, z1], [x2, z1], [x2, z2], [x1, z2]];

/**
 * UV planas para una ShapeGeometry: u = (x - x0) / size, v = (y - y0) / size en
 * coordenadas de la forma. Sirve para que un suelo con huecos se texture igual
 * que un PlaneGeometry de lado `size` con esquina en (x0, y0).
 */
export function setPlanarUV(g: THREE.BufferGeometry, x0: number, y0: number, size: number) {
  const pos = g.getAttribute('position'), uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x0) / size, (pos.getY(i) - y0) / size);
  uv.needsUpdate = true;
  return g;
}
