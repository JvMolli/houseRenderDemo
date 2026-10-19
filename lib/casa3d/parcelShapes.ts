/**
 * Helpers puros (sin three) que traducen el boceto de la parcela a polígonos en
 * px del plano del piso y a sólidos en metros.
 */
import {
  BBQ, BOUNDARY, BOUNDARY_RUNS, CAR_STEPS, CARS, DIAGONAL, fromSketch, GATE, GENERIC_HEIGHT, GLASS_RAIL, HATCH, LEVELS, MARKS,
  LOUNGERS, OUTCROP, OUTDOOR_STAIR, OUTFITS, OUTLINE, POOL, PUMP, STAIR, STREET, STRIP, SWIMMER, TERRACE, TERRACE_SET,
  type Outfit, type Pose, type SPt,
} from './parcel';
import { GROUND, GROUND_RECT, GROUND_SO_WALL, GROUND_WINDOW, TERRAIN_HALF, type MaterialKey, type MBox, type Pt, type Rect } from './plan';
import { mbox, pbox, type BoxSolid, type CylSolid, type Solid } from './shapes';
import { FH, OX, OZ, S, X, Z, type Vec3 } from './units';

/** Polígono del boceto -> px del plano. */
export const sketchPoly = (pts: readonly SPt[]): Pt[] => pts.map(fromSketch);

/** Rectángulo del boceto -> rectángulo en px del plano (x1 < x2, z1 < z2). */
export function sketchRect([sx1, sy1, sx2, sy2]: Rect): Rect {
  const [ax, az] = fromSketch([sx1, sy1]), [bx, bz] = fromSketch([sx2, sy2]);
  return [Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz)];
}

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

export type ParcelSurface = 'terracePaving' | 'carsPaving' | 'facade';

/** Prisma de suelo: contorno en px del plano, desde el jardín hasta `top` (m). */
export interface Slab {
  points: Pt[];
  top: number;
  mat: ParcelSurface;
}

export const OUTLINE_PLAN: Pt[] = sketchPoly(OUTLINE);

/** Zonas elevadas sobre el jardín: terraza y coches. */
export const PLATFORMS: Slab[] = [
  { points: sketchPoly(TERRACE), top: LEVELS.raised, mat: 'terracePaving' },
  {
    points: sketchPoly([
      [CARS[0], CARS[1]], [CARS[2], CARS[1]], [CARS[2], CARS[3]], [STRIP[0], CARS[3]],
      ...sketchArc(CAR_STEPS.center, CAR_STEPS.center[0] - CAR_STEPS.lines[3], 90, 180),
    ]),
    top: LEVELS.raised, mat: 'carsPaving',
  },
];

const stepTop = (k: number, n: number) => LEVELS.garden + (k + 1) * (LEVELS.raised - LEVELS.garden) / (n + 1);

/** Peldaños junto a los coches (25 cm cada uno). La terraza no tiene: se entra desde la escalera de entrada. */
export const STEPS: Slab[] = [
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

/** Cara interior (Z, m) del muro del lindero en diagonal a la abscisa X (m), junto a la fachada SE. */
function diagonalWallInnerZ(x: number) {
  const [ax, az] = m(fromSketch(DIAGONAL.to)), [bx, bz] = m(fromSketch(DIAGONAL.from));
  const dx = bx - ax, dz = bz - az;
  return az + (x - ax) * dz / dx - BOUNDARY.thickness * Math.hypot(dx, dz) / Math.abs(dx);
}

/**
 * Escalera exterior: peldaños macizos desde la franja (cota del jardín) hasta un
 * rellano frente a la puerta, a cota FH. Donde el muro en diagonal se acerca a
 * la fachada, peldaños y rellano se recortan hasta su cara interior.
 */
export function outdoorStair(): { steps: BoxSolid[]; landing: Slab; tread: number; rise: number } {
  const [sx1, sz1, , sz2] = sketchRect(STAIR), z1 = Z(sz1);
  const outer = (x: number) => Math.min(Z(sz2), diagonalWallInnerZ(x) - 0.02);
  const [d1, d2] = OUTDOOR_STAIR.entranceDoor, mg = OUTDOOR_STAIR.landingMargin;
  const landing0 = X(d1) - mg, landing1 = X(d2) + mg;
  const start = X(sx1); // borde de la franja
  const risers = Math.ceil(FH / OUTDOOR_STAIR.maxRiser - 1e-9), rise = FH / risers, treads = risers - 1;
  const tread = (landing0 - start) / treads;
  const step = (xa: number, xb: number, top: number): BoxSolid => {
    const z2 = outer(xb);
    return { kind: 'box', size: [xb - xa, top, z2 - z1], position: [(xa + xb) / 2, top / 2, (z1 + z2) / 2], mat: 'facade' };
  };
  const px = (x: number, z: number): Pt => [OX + x * S, OZ + z * S];
  return {
    steps: Array.from({ length: treads }, (_, i) => step(start + i * tread, start + (i + 1) * tread, (i + 1) * rise)),
    landing: {
      points: [px(landing0, z1), px(landing1, z1), px(landing1, outer(landing1)), px(landing0, outer(landing0))],
      top: FH, mat: 'facade',
    },
    tread, rise,
  };
}

/** Rellano de la escalera exterior (prisma, porque su borde sigue el muro). */
export const LANDING: Slab = outdoorStair().landing;

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
  const top = LEVELS.raised + GLASS_RAIL.height, none: [number, number] = [0, 0];
  /** Cristal entre a y b; con `posts`, poste grafito en cada extremo. */
  const panel = (a: [number, number], b: [number, number], y0: number, y1: number, posts = true): Solid[] => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), glass = segmentBox(a, b, 0, L, none, 0.02, y0, y1, 'glass');
    return posts ? [
      glass,
      segmentBox(a, b, -0.025, 0.025, none, 0.05, y0, y1 + 0.05, 'graphite'),
      segmentBox(a, b, L - 0.025, L + 0.025, none, 0.05, y0, y1 + 0.05, 'graphite'),
    ] : [glass];
  };
  // Lado de la escalera: hasta el peldaño a cota de terraza (por ahí se entra) y, en el tramo que
  // sube por encima, un cristal por peldaño sobre su canto.
  const { steps } = outdoorStair(), edge = m(fromSketch(GLASS_RAIL.points.at(-1)!))[1] - 0.01;
  const x0 = (s: BoxSolid) => s.position[0] - s.size[0] / 2, x1 = (s: BoxSolid) => s.position[0] + s.size[0] / 2;
  const entry = steps.find(s => Math.abs(s.size[1] - LEVELS.raised) < 1e-6)!;
  const pts = [...GLASS_RAIL.points.map(p => m(fromSketch(p))), [x0(entry), edge] as [number, number]];
  const upper = steps.filter(s => s.size[1] > LEVELS.raised + 1e-6), first = upper[0], last = upper.at(-1)!;
  return [
    ...pts.slice(1).flatMap((b, i) => panel(pts[i], b, LEVELS.raised, top)),
    // Escalera: cristales sin postes intermedios y un poste al pie y otro arriba.
    ...upper.flatMap(s => panel([x0(s), edge], [x1(s), edge], s.size[1], s.size[1] + GLASS_RAIL.stairHeight, false)),
    mb(x0(first) - 0.025, x0(first) + 0.025, first.size[1], first.size[1] + GLASS_RAIL.stairHeight + 0.05, edge - 0.025, edge + 0.025, 'graphite'),
    mb(x1(last) - 0.025, x1(last) + 0.025, last.size[1], last.size[1] + GLASS_RAIL.stairHeight + 0.05, edge - 0.025, edge + 0.025, 'graphite'),
  ];
}

const boxOn = (r: Rect, y0: number, y1: number, mat: MaterialKey) => pbox([...sketchRect(r), y0, y1, mat]);

/** Barra rayada: muro del desnivel entre coches y franja (2 mm por debajo de los coches) y su marco oscuro encima. */
function hatchWall(): Solid[] {
  const [x1, z1, x2, z2] = sketchRect(HATCH), w = 0.02 * 119, y0 = LEVELS.raised, y1 = y0 + 0.006;
  return [
    pbox([x1, z1, x2, z2, LEVELS.garden, LEVELS.raised - 0.002, 'facade']),
    ...([
      [x1, z1, x2, z1 + w], [x1, z2 - w, x2, z2], [x1, z1, x1 + w, z2], [x2 - w, z1, x2, z2],
    ] as const).map(([a, b, c, d]) => pbox([a, b, c, d, y0, y1, 'black'])),
  ];
}

/** Portón en el frente de los coches, por dentro del lindero, con un pilar de obra a cada lado. */
function gate(): Solid[] {
  const a = m(fromSketch(GATE.from)), b = m(fromSketch(GATE.to)), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
  const probe: Pt = [((a[0] + b[0]) / 2 + nx * 0.05) * 119 + 78, ((a[1] + b[1]) / 2 + nz * 0.05) * 119 + 68];
  if (!insidePolygon(probe, OUTLINE_PLAN)) { nx = -nx; nz = -nz; }
  const t = BOUNDARY.thickness, off: [number, number] = [nx * t / 2, nz * t / 2], p = GATE.pillar;
  const top = LEVELS.raised + BOUNDARY.wall + BOUNDARY.fence;
  return [
    segmentBox(a, b, p, L - p, off, GATE.thickness, LEVELS.raised + 0.03, top, 'garageDoor'),
    segmentBox(a, b, 0, p, off, p, LEVELS.garden, top + 0.15, 'facade'),
    segmentBox(a, b, L - p, L, off, p, LEVELS.garden, top + 0.15, 'facade'),
  ];
}

/** Barbacoa de gas con carro: armario, encimera, tapa con tirador, baldas laterales y mandos. */
function barbecue(): Solid[] {
  const { gap, width: w, depth: d, body, top, lid, shelf } = BBQ;
  const z = (Z(GROUND_WINDOW.a) + Z(GROUND_WINDOW.b)) / 2 - w / 2; // borde de la barbacoa, centrada en la ventana
  const xf = X(GROUND_SO_WALL[0]) - gap - d; // frente (lado del cocinero)
  const y0 = LEVELS.garden, yTop = y0 + body + top;
  const boxes: MBox[] = [
    [d, body, w, xf, y0, z, 'graphite'],
    [d, top, w, xf, y0 + body, z, 'black'],
    [d - 0.05, lid, w - 0.04, xf + 0.05, yTop, z + 0.02, 'steel'],
    [0.03, 0.03, w * 0.7, xf + 0.01, yTop + lid - 0.07, z + w * 0.15, 'steel'],
    [d - 0.05, 0.03, shelf, xf + 0.025, yTop - 0.06, z - shelf, 'steel'],
    [d - 0.05, 0.03, shelf, xf + 0.025, yTop - 0.06, z + w, 'steel'],
    ...[0.2, 0.45, 0.7].map((t): MBox => [0.03, 0.05, 0.05, xf - 0.03, y0 + body - 0.1, z + w * t, 'black']),
  ];
  return boxes.map(mbox);
}

/* ---- Mobiliario del patio ---------------------------------------------------------- */

/** Sketch -> metros (x, z). */
const sm = (p: SPt) => m(fromSketch(p));

/** Caja por esquinas en metros. */
const mb = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: MaterialKey): BoxSolid =>
  mbox([Math.abs(x1 - x0), y1 - y0, z1 - z0, Math.min(x0, x1), y0, z0, mat]);

/** Tumbona plana: bastidor blanco, cojín y patas; a lo largo de X. */
function lounger([x, z]: [number, number]): Solid[] {
  const { length: L, width: W } = LOUNGERS, y = LEVELS.garden;
  return [
    mb(x - L / 2, x + L / 2, y + 0.18, y + 0.3, z - W / 2, z + W / 2, 'white'),
    mb(x - L / 2 + 0.02, x + L / 2 - 0.02, y + 0.3, y + 0.35, z - W / 2 + 0.03, z + W / 2 - 0.03, 'cushion'),
    ...[-1, 1].flatMap(i => [-1, 1].map(k =>
      mb(x + i * (L / 2 - 0.08) - 0.025, x + i * (L / 2 - 0.08) + 0.025, y, y + 0.18, z + k * (W / 2 - 0.06) - 0.025, z + k * (W / 2 - 0.06) + 0.025, 'white'))),
  ];
}

/** Silla de madera; `dir` = hacia dónde mira quien se sienta (+1: +X, -1: -X). */
function chair([x, z]: [number, number], dir: 1 | -1): Solid[] {
  const y = LEVELS.raised, s = 0.23, X0 = (lx: number) => x + dir * lx;
  return [
    mb(X0(-s), X0(s), y + 0.4, y + 0.45, z - s, z + s, 'wood'),
    mb(X0(-0.25), X0(-0.21), y + 0.45, y + 0.9, z - s, z + s, 'wood'),
    ...[-1, 1].flatMap(i => [-1, 1].map(k =>
      mb(X0(i * (s - 0.03)) - 0.02, X0(i * (s - 0.03)) + 0.02, y, y + 0.4, z + k * (s - 0.03) - 0.02, z + k * (s - 0.03) + 0.02, 'wood'))),
  ];
}

/** Mesita redonda: tablero blanco sobre pie grafito. */
function roundTable([x, z]: [number, number]): Solid[] {
  const y = LEVELS.raised;
  const c = (r: number, y0: number, h: number, mat: MaterialKey): CylSolid => ({ kind: 'cyl', r, h, position: [x, y0 + h / 2, z], mat });
  return [c(0.32, y + 0.55, 0.03, 'white'), c(0.03, y, 0.55, 'graphite'), c(0.2, y, 0.02, 'graphite')];
}

const CHAIR_DIRS = [1, -1] as const;

/** Tumbonas, sillas y mesita de la terraza. */
function patioFurniture(): Solid[] {
  return [
    ...LOUNGERS.at.flatMap(p => lounger(sm(p))),
    ...TERRACE_SET.chairs.flatMap((p, i) => chair(sm(p), CHAIR_DIRS[i])),
    ...roundTable(sm(TERRACE_SET.table)),
  ];
}

/* ---- Personas -------------------------------------------------------------------- */

/** Qué hace cada figura (animación). */
export type Activity = 'grill' | 'sunbathe' | 'sunbatheArm' | 'swim' | 'sip';

/** Figura: postura, posición (m), giro, ropa y actividad. Mira hacia +X antes de girar. */
export interface PersonSpec {
  pose: Pose;
  position: Vec3;
  rotationY: number;
  outfit: Outfit;
  activity: Activity;
  /** Desfase (s) para que no se muevan todos a la vez. */
  phase: number;
  holding?: 'mojito' | 'spatula';
  /** Recorrido de quien nada: elipse (m) dentro de la piscina. */
  lap?: { center: [number, number]; rx: number; rz: number };
}

/** Gente en el patio: barbacoa, dos tomando el sol, una en la piscina y dos en la terraza con un mojito. */
export const PEOPLE: readonly PersonSpec[] = (() => {
  const [bx, bz] = [X(GROUND_SO_WALL[0]) - BBQ.gap - BBQ.depth - 0.35, (Z(GROUND_WINDOW.a) + Z(GROUND_WINDOW.b)) / 2];
  const [s1, s2] = LOUNGERS.at.map(sm), [wx, wz] = sm(SWIMMER);
  const seats = TERRACE_SET.chairs.map(sm);
  const pool = sketchRectCenter(POOL.inner, 0).size;
  return [
    { pose: 'standing', position: [bx, LEVELS.garden, bz], rotationY: 0, outfit: OUTFITS.griller, activity: 'grill', phase: 0, holding: 'spatula' },
    { pose: 'lying', position: [s1[0], LEVELS.garden, s1[1]], rotationY: Math.PI, outfit: OUTFITS.sunbather1, activity: 'sunbathe', phase: 0 },
    { pose: 'lying', position: [s2[0], LEVELS.garden, s2[1]], rotationY: Math.PI, outfit: OUTFITS.sunbather2, activity: 'sunbatheArm', phase: 3 },
    {
      pose: 'swimming', position: [wx, LEVELS.garden - POOL.waterBelow, wz], rotationY: 0, outfit: OUTFITS.swimmer,
      activity: 'swim', phase: 0, lap: { center: [wx, wz], rx: pool[0] / 2 - 0.8, rz: pool[1] / 2 - 0.8 },
    },
    { pose: 'sitting', position: [seats[0][0], LEVELS.raised, seats[0][1]], rotationY: 0, outfit: OUTFITS.guest1, activity: 'sip', phase: 0, holding: 'mojito' },
    { pose: 'sitting', position: [seats[1][0], LEVELS.raised, seats[1][1]], rotationY: Math.PI, outfit: OUTFITS.guest2, activity: 'sip', phase: 3.5, holding: 'mojito' },
  ];
})();

/** Sólidos estáticos de la parcela (se fusionan por material). */
export const PARCEL_SOLIDS: readonly Solid[] = [
  ...boundarySolids(),
  ...outdoorStair().steps,
  ...poolBasin(),
  ...glassRail(),
  boxOn(PUMP.rect, LEVELS.garden, LEVELS.garden + PUMP.height, 'white'),
  ...MARKS.map(({ rect, level }) => boxOn(rect, LEVELS[level], LEVELS[level] + GENERIC_HEIGHT, 'white')),
  boxOn(OUTCROP.outer, LEVELS.outside, LEVELS.outside + GENERIC_HEIGHT, 'white'),
  boxOn(OUTCROP.inner, LEVELS.outside, LEVELS.outside + GENERIC_HEIGHT + 0.05, 'white'),
  ...hatchWall(),
  ...gate(),
  ...barbecue(),
  ...patioFurniture(),
];

/* ---- Calle ------------------------------------------------------------------- */

/** x (m) del lindero del portón: la calle va a lo largo de z, hacia -x. */
const STREET_EDGE = X(fromSketch(GATE.from)[0]);

/** Franjas de la calle en x (m), [min, max]: acera, bordillo y calzada. */
export const STREET_BANDS = (() => {
  const kerb = STREET_EDGE - STREET.sidewalk, road = kerb - STREET.kerb;
  return {
    sidewalk: [kerb, STREET_EDGE] as const,
    kerb: [road, kerb] as const,
    road: [road - STREET.road, road] as const,
  };
})();

/** Tramo de la calle en z (m): el del terreno de la maqueta o, en el modo videojuego, hasta el horizonte. */
export const STREET_SPAN = {
  ground: [Z(GROUND_RECT[1]), Z(GROUND_RECT[3])] as const,
  horizon: [GROUND.position[2] - TERRAIN_HALF, GROUND.position[2] + TERRAIN_HALF] as const,
};

/** Bordillo (rebajado frente al portón) y línea central discontinua entre z0 y z1. */
function streetSolids([z0, z1]: readonly [number, number]): Solid[] {
  const [k0, k1] = STREET_BANDS.kerb, [r0, r1] = STREET_BANDS.road, y = LEVELS.outside;
  const [g0, g1] = [GATE.from, GATE.to].map(p => Z(fromSketch(p)[1])).sort((a, b) => a - b);
  const kerb = (za: number, zb: number, h: number) => mbox([k1 - k0, h, zb - za, k0, y, za, 'kerb']);
  const out: Solid[] = [kerb(z0, g0, STREET.kerbHeight), kerb(g0, g1, 0.02), kerb(g1, z1, STREET.kerbHeight)];
  const xc = (r0 + r1) / 2;
  for (let z = z0 + STREET.gap / 2; z + STREET.dash <= z1; z += STREET.dash + STREET.gap) {
    out.push(mbox([STREET.line, 0.004, STREET.dash, xc - STREET.line / 2, y + STREET.lift, z, 'white']));
  }
  return out;
}

export const STREET_SOLIDS: readonly Solid[] = streetSolids(STREET_SPAN.ground);
export const STREET_SOLIDS_LONG: readonly Solid[] = streetSolids(STREET_SPAN.horizon);

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
