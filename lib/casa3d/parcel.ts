/**
 * Plano de la parcela (plano-parcela.html). Las coordenadas van en unidades
 * del SVG, 1:1 con el boceto. El boceto no tiene escala: se encaja estirando el
 * rectángulo «Casa» sobre la huella real de la casa, girado 90°, de modo que
 * arriba del boceto = SO (la puerta de la planta baja da a la franja y a los coches) y
 * la entrada (fachada SE) queda junto a la escalera exterior.
 */
import { FP, FP_BOUNDS, type Pt, type Rect } from './plan';
import type { Px } from './units';

/** Punto del boceto en unidades del SVG. */
export type SPt = readonly [sx: number, sy: number];

/** Rectángulo «Casa» del boceto: se hace coincidir con FP_BOUNDS. */
export const SKETCH_HOUSE: Rect = [840, 455, 1350, 765];

/** Boceto -> px del plano del piso: sy crece hacia el NE (+x), sx crece hacia el NO (-z). */
export function fromSketch([sx, sy]: SPt): Pt {
  const [hx1, hy1, hx2, hy2] = SKETCH_HOUSE, [x1, z1, x2, z2] = FP_BOUNDS;
  return [x1 + (sy - hy1) * (x2 - x1) / (hy2 - hy1), z1 + (hx2 - sx) * (z2 - z1) / (hx2 - hx1)];
}

/** px del plano del piso -> boceto (inversa de fromSketch). */
export function toSketch([x, z]: Pt): SPt {
  const [hx1, hy1, hx2, hy2] = SKETCH_HOUSE, [x1, z1, x2, z2] = FP_BOUNDS;
  return [hx2 - (z - z1) * (hx2 - hx1) / (z2 - z1), hy1 + (x - x1) * (hy2 - hy1) / (x2 - x1)];
}

/** Cotas (m) respecto al suelo de la planta baja. */
export const LEVELS = {
  /** Casa, franja, coches, terraza, arranque de la escalera y exterior de la parcela. */
  raised: 0,
  /** Jardín y piscina: 1 m por debajo de la terraza y los coches. */
  garden: -1,
};

/** Contorno de la parcela. */
export const OUTLINE: readonly SPt[] = [[165, 20], [1105, 20], [1105, 335], [1350, 335], [1350, 765], [460, 765]];

/* ---- Zonas a cota 0 (el resto de la parcela es jardín) ---------------------- */

export const TERRACE: readonly SPt[] = [[319.4, 410], [765, 410], [765, 765], [460, 765]];
/** Zona de coches; la esquina inferior izquierda la redondean los escalones (radio 25). */
export const CARS: Rect = [815, 20, 1105, 335];
export const STRIP: Rect = [840, 335, 1350, 455];
export const STAIR: Rect = [765, 455, 840, 765];

/* ---- Escalones (cada uno baja 25 cm: 4 peldaños = 1 m) ----------------------- */

/** Entre terraza y piscina: líneas de peldaño (sy) de abajo hacia la terraza y extremo derecho (sx). */
export const TERRACE_STEPS = { lines: [388, 395.3, 402.7, 410], right: 620 };
/** Junto a los coches: líneas de peldaño (sx), tramo recto de sy 20 a 300 y giro alrededor de (840, 300). */
export const CAR_STEPS = { lines: [790, 798.3, 806.7, 815], top: 20, bottom: 300, center: [840, 300] as SPt };

/* ---- Piscina y depuradora --------------------------------------------------- */

export const POOL = {
  outer: [450, 110, 715, 260] as Rect,
  inner: [462, 122, 703, 248] as Rect,
  /** Profundidad del vaso (m), lámina de agua bajo la coronación (m) y grosor de la coronación (m). */
  depth: 1.5,
  waterBelow: 0.08,
  coping: 0.03,
};

/** Depuradora: caseta de 1 m de alto sobre el jardín. */
export const PUMP = { rect: [210, 55, 270, 111] as Rect, height: 1 };

/* ---- Cristalera en el borde de la terraza ----------------------------------- */

export const GLASS_RAIL = { from: [640, 410] as SPt, to: [765, 410] as SPt, height: 1 };

/* ---- Elementos sin aclarar, dibujados tal cual en el boceto ------------------ */

/** Barra rayada entre coches y franja, a ras de suelo. */
export const HATCH: Rect = [880, 323, 1105, 347];
/** Marcas pequeñas junto a la casa: cajas bajas genéricas. */
export const MARKS: readonly Rect[] = [[880, 457, 900, 475], [842, 708, 864, 726]];
/** Saliente en el lindero superior (fuera de la parcela) con su cuadrado interior. */
export const OUTCROP = { outer: [925, -28, 985, 20] as Rect, inner: [943, -14, 965, 8] as Rect };
/** Altura de las cajas genéricas (m). */
export const GENERIC_HEIGHT = 0.3;

/* ---- Cerramiento -------------------------------------------------------------- */

/** Muro de 1 m sobre el suelo interior y 50 cm de valla metálica grafito encima. */
export const BOUNDARY = { thickness: 0.2, wall: 1, fence: 0.5 };

/** Esquina NE del chaflán de la casa en el boceto: desde ahí hasta la escalera no hay fachada en el lindero. */
const CHAMFER_ON_BOUNDARY = toSketch(FP[2]);

/**
 * Tramos del cerramiento con la cota del suelo interior. Donde la fachada está
 * en el lindero no hay muro, y el frente de los coches (sx 815..1105) queda
 * abierto: es la entrada a la parcela.
 */
export const BOUNDARY_RUNS: readonly { points: readonly SPt[]; level: number }[] = [
  { points: [[165, 20], [815, 20]], level: LEVELS.garden },
  { points: [[1105, 20], [1105, 335], [1350, 335], [1350, 455]], level: LEVELS.raised },
  { points: [CHAMFER_ON_BOUNDARY, [460, 765], [319.4, 410]], level: LEVELS.raised },
  { points: [[319.4, 410], [165, 20]], level: LEVELS.garden },
];

/* ---- Escalera exterior ---------------------------------------------------------- */

/**
 * Arranca junto a la franja (se llega desde los coches) y sube pegada a la
 * fachada SE hasta un rellano frente a la puerta de entrada (a la altura del
 * piso). `maxRiser`: tabica máxima (m); `landingMargin`: lo que sobresale el
 * rellano a cada lado de la puerta (m).
 */
export const OUTDOOR_STAIR = { maxRiser: 0.2, landingMargin: 0.1, entranceDoor: [405, 500] as readonly [Px, Px] };
