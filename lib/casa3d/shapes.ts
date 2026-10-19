/**
 * Helpers de geometría puros (sin three): traducen los datos del plano a
 * sólidos en metros, igual que box(), B(), cyl() y wall() del original.
 */
import type { Box, Cyl, MaterialKey, MBox, Pt, Rect, Wall } from './plan';
import { HT, X, Z, type Vec3 } from './units';

/** Caja en metros: tamaño, centro y giro opcional alrededor de Y. */
export interface BoxSolid {
  kind: 'box';
  size: Vec3;
  position: Vec3;
  rotationY?: number;
  mat: MaterialKey;
}

/** Cilindro vertical en metros, por su centro. */
export interface CylSolid {
  kind: 'cyl';
  r: number;
  h: number;
  position: Vec3;
  mat: MaterialKey;
}

export type Solid = BoxSolid | CylSolid;

/** box(): caja por tamaño y esquina mínima en metros. */
export const mbox = ([w, h, d, x, y, z, mat]: MBox): BoxSolid => ({
  kind: 'box', size: [w, h, d], position: [x + w / 2, y + h / 2, z + d / 2], mat,
});

/** B(): caja por rectángulo del plano en px y alturas en metros. */
export const pbox = ([x1, z1, x2, z2, y0, y1, mat]: Box): BoxSolid =>
  mbox([X(x2) - X(x1), y1 - y0, Z(z2) - Z(z1), X(x1), y0, Z(z1), mat]);

/** cyl(): cilindro con centro en el plano (px). */
export const cyl = ([px, pz, r, y0, h, mat]: Cyl): CylSolid => ({
  kind: 'cyl', r, h, position: [X(px), y0 + h / 2, Z(pz)], mat,
});

/** wall(): muro con huecos de ventanas y puertas, como lista de cajas B(). */
export function wallBoxes([dir, a1, a2, c1, c2, ops = []]: Wall): Box[] {
  const out: Box[] = [];
  const seg = (s: number, e: number, y0: number, y1: number, mat: MaterialKey, b1 = a1, b2 = a2) => {
    if (e - s <= 0 || y1 - y0 <= 0) return;
    out.push(dir === 'h' ? [s, b1, e, b2, y0, y1, mat] : [b1, s, b2, e, y0, y1, mat]);
  };
  let cur = c1;
  for (const o of ops) {
    seg(cur, o.a, 0, HT, 'wall'); seg(o.a, o.b, 0, o.s, 'wall'); seg(o.a, o.b, o.h, HT, 'wall');
    const md = (a1 + a2) / 2, m1 = md - 3, m2 = md + 3;
    if (o.w) {
      seg(o.a, o.b, o.s, o.h, 'glass', md - 1, md + 1);
      seg(o.a, o.b, o.s, o.s + 0.05, 'black', m1, m2); seg(o.a, o.b, o.h - 0.05, o.h, 'black', m1, m2);
      seg(o.a, o.a + 6, o.s, o.h, 'black', m1, m2); seg(o.b - 6, o.b, o.s, o.h, 'black', m1, m2);
      const c = (o.a + o.b) / 2;
      seg(c - 3, c + 3, o.s, o.h, 'black', m1, m2);
    }
    if (o.d) {
      seg(o.a + 4, o.b - 4, 0, o.h, 'door', m1, m2);
      const c = o.a + (o.b - o.a) * 0.3;
      seg(c - 5, c + 5, 0.4, 1.8, 'frost', m1 - 1, m2 + 1);
    }
    cur = o.b;
  }
  seg(cur, c2, 0, HT, 'wall');
  return out;
}

/** Muro girado entre dos puntos del plano, de altura HT. */
export function chamferWall(from: Pt, to: Pt, thickness: number): BoxSolid {
  const x1 = X(from[0]), z1 = Z(from[1]), x2 = X(to[0]), z2 = Z(to[1]), dx = x2 - x1, dz = z2 - z1;
  return {
    kind: 'box', size: [Math.hypot(dx, dz), HT, thickness], position: [(x1 + x2) / 2, HT / 2, (z1 + z2) / 2],
    rotationY: Math.atan2(-dz, dx), mat: 'wall',
  };
}

/**
 * Revestimiento sobre la cara de un muro girado: caja fina paralela al muro de
 * `from` a `to`, desplazada `offset` m en perpendicular (positivo: a la
 * izquierda yendo de from a to) y recortada a `t0..t1` (fracción del largo).
 */
export function wallFacing(from: Pt, to: Pt, offset: number, thickness: number, t0: number, t1: number,
  y0: number, y1: number, mat: MaterialKey): BoxSolid {
  const x1 = X(from[0]), z1 = Z(from[1]), x2 = X(to[0]), z2 = Z(to[1]), dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz);
  const nx = dz / L, nz = -dx / L, tm = (t0 + t1) / 2;
  return {
    kind: 'box', size: [L * (t1 - t0), y1 - y0, thickness],
    position: [x1 + dx * tm + nx * offset, (y0 + y1) / 2, z1 + dz * tm + nz * offset],
    rotationY: Math.atan2(-dz, dx), mat,
  };
}

/* ---- Muebles ---------------------------------------------------------- */

export const stool = ([px, pz]: Pt): Cyl[] => [
  [px, pz, 0.18, 0.66, 0.07, 'cushion'], [px, pz, 0.025, 0, 0.66, 'black'], [px, pz, 0.15, 0, 0.02, 'black'],
];

export function armchair([x1, z1, x2, z2, backLeft]: readonly [...Rect, boolean]): Box[] {
  const b = backLeft ? [x1, x1 + 14] : [x2 - 14, x2];
  return [
    [x1, z1, x2, z2, 0.18, 0.42, 'cushion'], [b[0], z1, b[1], z2, 0.18, 0.85, 'cushion'],
    [x1, z1, x2, z1 + 6, 0, 0.6, 'wood'], [x1, z2 - 6, x2, z2, 0, 0.6, 'wood'],
  ];
}

export function closet([x1, z1, x2, z2, n]: readonly [...Rect, number]): Box[] {
  const w = (x2 - x1) / n;
  return Array.from({ length: n }, (_, i): Box => [x1 + i * w, z1, x1 + (i + 1) * w - 1, z2, 0, 2.5, i % 2 ? 'wood' : 'white']);
}

export function bed([x1, z1, x2, z2]: Rect): Box[] {
  const m = (x1 + x2) / 2;
  return [
    [x1, z1 + 6, x2, z2, 0, 0.3, 'wood'], [x1 + 3, z1 + 8, x2 - 3, z2 - 2, 0.3, 0.52, 'linen'], [x1 - 4, z1, x2 + 4, z1 + 7, 0, 1.05, 'wood'],
    [x1 + 10, z1 + 12, m - 4, z1 + 40, 0.52, 0.64, 'linen'], [m + 4, z1 + 12, x2 - 10, z1 + 40, 0.52, 0.64, 'linen'],
    [x1 + 3, (z1 + z2) / 2 + 10, x2 - 3, z2 - 2, 0.52, 0.56, 'throw'],
  ];
}
