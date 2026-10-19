/**
 * Geometrías de three a partir de los sólidos del plano.
 * Las piezas estáticas se fusionan por material: una malla por material y
 * grupo en lugar de una por caja, con las mismas UV y la misma forma.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { MaterialKey, Pt } from './plan';
import type { Solid } from './shapes';
import { X, Z, type Vec3 } from './units';

/** Materiales con juntas o dibujo a escala: sus cajas llevan UV en metros (no 0..1 por cara). */
const METRIC_UV: ReadonlySet<MaterialKey> = new Set(['slate']);

/**
 * Modo videojuego: cantos redondeados en los muebles. Los muros no (van en
 * tramos y se verían las juntas entre cajas), ni las carpinterías, ni las
 * piezas largas de fuera (valla, bordillo): sus cantos son triángulos larguísimos
 * y finísimos que se pintan como puntos sueltos.
 */
const BEVEL: ReadonlySet<MaterialKey> = new Set([
  'wood', 'white', 'stone', 'cushion', 'sofa', 'linen', 'throw', 'table', 'steel', 'tub', 'handle', 'shelf',
  'oakMedium', 'mirror',
]);
/** Radio máximo del canto (m); en piezas finas, una cuarta parte del lado menor. */
const BEVEL_RADIUS = 0.012;

/** Proyección de caja en metros: (x, y) en caras ±Z, (z, y) en ±X y (x, z) en ±Y. */
function boxProject(x: number, y: number, z: number, nx: number, ny: number): [number, number] {
  if (Math.abs(nx) > 0.5) return [z, y];
  if (Math.abs(ny) > 0.5) return [x, z];
  return [x, y];
}

/**
 * UV en metros según la orientación de cada cara. Con `offset` se usan
 * coordenadas del mundo para que las juntas sigan de una caja a la siguiente.
 */
function metricUV(g: THREE.BufferGeometry, offset: Vec3) {
  const pos = g.getAttribute('position'), nor = g.getAttribute('normal'), uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, ...boxProject(pos.getX(i) + offset[0], pos.getY(i) + offset[1], pos.getZ(i) + offset[2], nor.getX(i), nor.getY(i)));
  }
  uv.needsUpdate = true;
}

/**
 * Segundo juego de UV (canal 1) en metros, por proyección de caja en el
 * espacio de la geometría: lo usan las texturas fotografiadas del modo
 * videojuego, que así salen a su tamaño real en cualquier pieza.
 */
export function addMetricUV1(g: THREE.BufferGeometry) {
  const pos = g.getAttribute('position'), nor = g.getAttribute('normal');
  if (g.getAttribute('uv1') || !pos || !nor) return;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const [u, v] = boxProject(pos.getX(i), pos.getY(i), pos.getZ(i), nor.getX(i), nor.getY(i));
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  g.setAttribute('uv1', new THREE.BufferAttribute(uv, 2));
}

function boxGeometry(size: Vec3, mat: MaterialKey, bevel: boolean): THREE.BufferGeometry {
  const r = Math.min(BEVEL_RADIUS, Math.min(...size) / 4);
  return bevel && BEVEL.has(mat) && r >= 0.004 ? new RoundedBoxGeometry(...size, 1, r) : new THREE.BoxGeometry(...size);
}

/** Geometría de un sólido; con `bevel`, cantos redondeados (modo videojuego). */
export function solidGeometry(s: Solid, bevel = false): THREE.BufferGeometry {
  const g = s.kind === 'box' ? boxGeometry(s.size, s.mat, bevel) : new THREE.CylinderGeometry(s.r, s.r, s.h, 24);
  // Cajas giradas: UV en su espacio local (a lo largo de la cara); el resto, en coordenadas del mundo.
  if (s.kind === 'box' && METRIC_UV.has(s.mat)) metricUV(g, s.rotationY ? [0, s.position[1], 0] : s.position);
  if (s.kind === 'box' && s.rotationY) g.rotateY(s.rotationY);
  return g.translate(...s.position);
}

/**
 * Fusiona los sólidos de cada material en una sola geometría. Con `bevel`
 * todo va sin índice, porque las cajas redondeadas no lo llevan.
 */
export function mergeByMaterial(solids: readonly Solid[], bevel = false): { mat: MaterialKey; geometry: THREE.BufferGeometry }[] {
  const groups = new Map<MaterialKey, THREE.BufferGeometry[]>();
  for (const s of solids) {
    const list = groups.get(s.mat) ?? [];
    const g = solidGeometry(s, bevel);
    if (bevel && g.index) {
      list.push(g.toNonIndexed());
      g.dispose();
    } else list.push(g);
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
