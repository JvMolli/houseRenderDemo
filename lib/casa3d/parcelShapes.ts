/**
 * Helpers puros (sin three) que traducen el boceto de la parcela a polígonos en
 * px del plano del piso y a sólidos en metros.
 */
import {
  BOUNDARY, BOUNDARY_RUNS, CAR_STEPS, CARS, fromSketch, GENERIC_HEIGHT, GLASS_RAIL, HATCH, LEVELS, MARKS,
  OUTCROP, OUTDOOR_STAIR, OUTLINE, POOL, PUMP, SKETCH_HOUSE, STAIR, STRIP, TERRACE, TERRACE_STEPS, type SPt,
} from './parcel';
import type { MaterialKey, Pt, Rect } from './plan';
import { pbox, type BoxSolid, type Solid } from './shapes';
import { FH, X, Z, type Vec3 } from './units';

/** Polígono del boceto -> px del plano. */
export const sketchPoly = (pts: readonly SPt[]): Pt[] => pts.map(fromSketch);

/** Rectángulo del boceto -> rectángulo en px del plano (x1 < x2, z1 < z2). */
export function sketchRect([sx1, sy1, sx2, sy2]: Rect): Rect {
  const [ax, az] = fromSketch([sx1, sy1]), [bx, bz] = fromSketch([sx2, sy2]);
  return [Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz)];
}

const rectPoly = ([x1, z1, x2, z2]: Rect): SPt[] => [[x1, z1], [x2, z1], [x2, z2], [x1, z2]];

/** Arco en el boceto (y hacia abajo): ángulos en grados, extremos incluidos. */
export function sketchArc([cx, cy]: SPt, r: number, from: number, to: number, n = 12): SPt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (from + (to - from) * i / n) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as SPt;
  });
}

/** Punto dentro de un polígono (par-impar). */
export function insidePolygon([x, z]: Pt, poly: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/* ---- Suelos ------------------------------------------------------------------- */

export type ParcelSurface = 'terracePaving' | 'carsPaving' | 'stripPaving';

/** Prisma de suelo: contorno en px del plano, desde el jardín hasta `top` (m). */
export interface Slab {
  points: Pt[];
  top: number;
  mat: ParcelSurface;
}

export const OUTLINE_PLAN: Pt[] = sketchPoly(OUTLINE);

/** Zonas a cota 0 sobre el jardín. */
export const PLATFORMS: Slab[] = [
  { points: sketchPoly(TERRACE), top: LEVELS.raised, mat: 'terracePaving' },
  {
    points: sketchPoly([
      [CARS[0], CARS[1]], [CARS[2], CARS[1]], [CARS[2], CARS[3]], [STRIP[0], CARS[3]],
      ...sketchArc(CAR_STEPS.center, CAR_STEPS.center[0] - CAR_STEPS.lines[3], 90, 180),
    ]),
    top: LEVELS.raised, mat: 'carsPaving',
  },
  { points: sketchPoly(rectPoly(STRIP)), top: LEVELS.raised, mat: 'stripPaving' },
  { points: sketchPoly(rectPoly(STAIR)), top: LEVELS.raised, mat: 'stripPaving' },
  { points: sketchPoly(rectPoly(SKETCH_HOUSE)), top: LEVELS.raised, mat: 'stripPaving' },
];

const stepTop = (k: number, n: number) => LEVELS.garden + (k + 1) * (LEVELS.raised - LEVELS.garden) / (n + 1);

/** x del lindero en diagonal (de OUTLINE[5] a OUTLINE[0]) a la altura sy. */
function diagonalX(sy: number) {
  const [ax, ay] = OUTLINE[5], [bx, by] = OUTLINE[0];
  return ax + (sy - ay) * (bx - ax) / (by - ay);
}

/** Peldaños entre terraza y piscina y junto a los coches (25 cm cada uno). */
export const STEPS: Slab[] = [
  ...TERRACE_STEPS.lines.slice(0, -1).map((y0, k, arr): Slab => {
    const y1 = TERRACE_STEPS.lines[k + 1], r = TERRACE_STEPS.right;
    return { points: sketchPoly([[diagonalX(y0), y0], [r, y0], [r, y1], [diagonalX(y1), y1]]), top: stepTop(k, arr.length), mat: 'terracePaving' };
  }),
  ...CAR_STEPS.lines.slice(0, -1).map((x0, k, arr): Slab => {
    const x1 = CAR_STEPS.lines[k + 1], c = CAR_STEPS.center, rOut = c[0] - x0, rIn = c[0] - x1;
    return {
      points: sketchPoly([
        [x0, CAR_STEPS.top], ...sketchArc(c, rOut, 180, 90), ...sketchArc(c, rIn, 90, 180), [x1, CAR_STEPS.top],
      ]),
      top: stepTop(k, arr.length), mat: 'carsPaving',
    };
  }),
];

/* ---- Sólidos -------------------------------------------------------------------- */

/** px del plano -> metros (x, z). */
const m = ([x, z]: Pt): [number, number] => [X(x), Z(z)];

/** Caja a lo largo de un segmento (metros), desplazada `offset` m en perpendicular. */
function segmentBox(a: [number, number], b: [number, number], s0: number, s1: number, offset: [number, number],
  thickness: number, y0: number, y1: number, mat: MaterialKey): BoxSolid {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, s = (s0 + s1) / 2;
  return {
    kind: 'box', size: [s1 - s0, y1 - y0, thickness],
    position: [a[0] + ux * s + offset[0], (y0 + y1) / 2, a[1] + uz * s + offset[1]],
    rotationY: Math.atan2(-dz, dx), mat,
  };
}

/** Muro de 1 m sobre el suelo interior (cimentado hasta el jardín) y valla grafito encima, por dentro del lindero. */
function boundarySolids(): Solid[] {
  const out: Solid[] = [], t = BOUNDARY.thickness;
  for (const run of BOUNDARY_RUNS) {
    const pts = run.points.map(p => m(fromSketch(p)));
    const wallTop = run.level + BOUNDARY.wall, fenceTop = wallTop + BOUNDARY.fence;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      // Normal hacia dentro de la parcela
      let nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
      const mid: Pt = [((a[0] + b[0]) / 2 + nx * 0.05) * 119 + 78, ((a[1] + b[1]) / 2 + nz * 0.05) * 119 + 68];
      if (!insidePolygon(mid, OUTLINE_PLAN)) { nx = -nx; nz = -nz; }
      const off: [number, number] = [nx * t / 2, nz * t / 2];
      out.push(segmentBox(a, b, -t / 2, L + t / 2, off, t, LEVELS.garden, wallTop, 'facade'));
      // Valla: postes cada 2 m como mucho, barrotes cada 12 cm y pasamanos arriba y abajo
      const posts = Math.max(1, Math.ceil(L / 2));
      for (let k = 0; k <= posts; k++) {
        const s = L * k / posts;
        out.push(segmentBox(a, b, s - 0.025, s + 0.025, off, 0.05, wallTop, fenceTop, 'graphite'));
      }
      for (let s = 0.12; s < L - 0.06; s += 0.12) out.push(segmentBox(a, b, s - 0.01, s + 0.01, off, 0.02, wallTop, fenceTop, 'graphite'));
      out.push(segmentBox(a, b, 0, L, off, 0.03, fenceTop - 0.03, fenceTop, 'graphite'));
      out.push(segmentBox(a, b, 0, L, off, 0.03, wallTop + 0.04, wallTop + 0.07, 'graphite'));
    }
  }
  return out;
}

/** Escalera exterior: peldaños macizos desde la franja hasta un rellano frente a la puerta, a cota FH. */
export function outdoorStair(): { steps: BoxSolid[]; landing: BoxSolid; tread: number; rise: number } {
  const [sx1, sz1, , sz2] = sketchRect(STAIR), z1 = Z(sz1), z2 = Z(sz2);
  const [d1, d2] = OUTDOOR_STAIR.entranceDoor, mg = OUTDOOR_STAIR.landingMargin;
  const landing0 = X(d1) - mg, landing1 = X(d2) + mg;
  const start = X(sx1); // borde de la franja
  const risers = Math.ceil(FH / OUTDOOR_STAIR.maxRiser - 1e-9), rise = FH / risers, treads = risers - 1;
  const tread = (landing0 - start) / treads;
  const box = (xa: number, xb: number, top: number): BoxSolid => ({
    kind: 'box', size: [xb - xa, top, z2 - z1], position: [(xa + xb) / 2, top / 2, (z1 + z2) / 2], mat: 'facade',
  });
  return {
    steps: Array.from({ length: treads }, (_, i) => box(start + i * tread, start + (i + 1) * tread, (i + 1) * rise)),
    landing: box(landing0, landing1, FH),
    tread, rise,
  };
}

/** Vaso de la piscina: paredes de 10 cm por fuera de la lámina y fondo. */
function poolBasin(): Solid[] {
  const [x1, z1, x2, z2] = sketchRect(POOL.inner), w = 0.1 * 119, top = LEVELS.garden, bottom = top - POOL.depth;
  return ([
    [x1 - w, z1 - w, x2 + w, z1, bottom, top, 'poolTile'],
    [x1 - w, z2, x2 + w, z2 + w, bottom, top, 'poolTile'],
    [x1 - w, z1, x1, z2, bottom, top, 'poolTile'],
    [x2, z1, x2 + w, z2, bottom, top, 'poolTile'],
    [x1, z1, x2, z2, bottom - 0.1, bottom, 'poolTile'],
  ] as const).map(pbox);
}

/** Cristalera en el borde de la terraza con sus dos remates. */
function glassRail(): Solid[] {
  const a = m(fromSketch(GLASS_RAIL.from)), b = m(fromSketch(GLASS_RAIL.to)), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const top = LEVELS.raised + GLASS_RAIL.height, none: [number, number] = [0, 0];
  return [
    segmentBox(a, b, 0, L, none, 0.02, LEVELS.raised, top, 'glass'),
    segmentBox(a, b, -0.025, 0.025, none, 0.05, LEVELS.raised, top + 0.05, 'graphite'),
    segmentBox(a, b, L - 0.025, L + 0.025, none, 0.05, LEVELS.raised, top + 0.05, 'graphite'),
  ];
}

const boxOn = (r: Rect, y0: number, y1: number, mat: MaterialKey) => pbox([...sketchRect(r), y0, y1, mat]);

/** Marco oscuro de la barra rayada (a ras de suelo). */
function hatchFrame(): Solid[] {
  const [x1, z1, x2, z2] = sketchRect(HATCH), w = 0.02 * 119, y0 = LEVELS.raised, y1 = y0 + 0.006;
  return ([
    [x1, z1, x2, z1 + w], [x1, z2 - w, x2, z2], [x1, z1, x1 + w, z2], [x2 - w, z1, x2, z2],
  ] as const).map(([a, b, c, d]) => pbox([a, b, c, d, y0, y1, 'black']));
}

/** Sólidos estáticos de la parcela (se fusionan por material). */
export const PARCEL_SOLIDS: readonly Solid[] = [
  ...boundarySolids(),
  ...outdoorStair().steps,
  outdoorStair().landing,
  ...poolBasin(),
  ...glassRail(),
  boxOn(PUMP.rect, LEVELS.garden, LEVELS.garden + PUMP.height, 'white'),
  ...MARKS.map(r => boxOn(r, LEVELS.raised, LEVELS.raised + GENERIC_HEIGHT, 'white')),
  boxOn(OUTCROP.outer, LEVELS.raised, LEVELS.raised + GENERIC_HEIGHT, 'white'),
  boxOn(OUTCROP.inner, LEVELS.raised, LEVELS.raised + GENERIC_HEIGHT + 0.05, 'white'),
  ...hatchFrame(),
];

/** Centro (m) y tamaño de un rectángulo del boceto, para planos sueltos (agua, barra rayada). */
export function sketchRectCenter(r: Rect, y: number): { position: Vec3; size: [number, number] } {
  const [x1, z1, x2, z2] = sketchRect(r);
  return { position: [(X(x1) + X(x2)) / 2, y, (Z(z1) + Z(z2)) / 2], size: [X(x2) - X(x1), Z(z2) - Z(z1)] };
}

/** Centro (m) del rectángulo que envuelve la parcela: centro de la cámara de sombras. */
export const PARCEL_CENTER: Vec3 = (() => {
  const xs = OUTLINE_PLAN.map(p => X(p[0])), zs = OUTLINE_PLAN.map(p => Z(p[1]));
  return [(Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2];
})();
