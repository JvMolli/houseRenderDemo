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
  /** Jardín, piscina, franja (césped artificial), planta baja y arranque de la escalera. */
  garden: 0,
  /** Terraza y coches: 1 m por encima del resto del patio. */
  raised: 1,
  /** Calle y terreno fuera de la parcela, a la cota de los coches (por ahí entran). */
  outside: 1,
};

/** Esquinas del chaflán de la casa en el boceto: la del lado NE y la del baño (lado SE). */
const CHAMFER_NE = toSketch(FP[2]);
const BATH_CORNER = toSketch(FP[3]);

/**
 * Lindero en diagonal: de la esquina de la depuradora directo a la esquina
 * exterior del baño (la parcela es más triangular que en el boceto original).
 */
export const DIAGONAL = { from: [165, 20] as SPt, to: BATH_CORNER };

/** x del lindero en diagonal a la altura sy, e y a la abscisa sx. */
export function diagonalX(sy: number) {
  const [ax, ay] = DIAGONAL.from, [bx, by] = DIAGONAL.to;
  return ax + (sy - ay) * (bx - ax) / (by - ay);
}
export function diagonalY(sx: number) {
  const [ax, ay] = DIAGONAL.from, [bx, by] = DIAGONAL.to;
  return ay + (sx - ax) * (by - ay) / (bx - ax);
}

/** Contorno de la parcela: la fachada NO, la NE y el chaflán de la casa hacen de lindero. */
export const OUTLINE: readonly SPt[] = [
  DIAGONAL.from, [1105, 20], [1105, 335], [1350, 335], [1350, 765], CHAMFER_NE, BATH_CORNER,
];

/* ---- Zonas elevadas (terraza y coches); el resto de la parcela es césped ------- */

/**
 * Terraza: triángulo entre la diagonal, el borde de la cristalera hacia la
 * piscina (sy 350) y la escalera de entrada (sx 765). No tiene escalones
 * propios: se entra desde el peldaño de la escalera que queda a su altura.
 */
export const TERRACE_EDGE = 350;
export const TERRACE: readonly SPt[] = [[diagonalX(TERRACE_EDGE), TERRACE_EDGE], [765, TERRACE_EDGE], [765, diagonalY(765)]];
/** Zona de coches; la esquina inferior izquierda la redondean los escalones (radio 25). */
export const CARS: Rect = [815, 20, 1105, 335];
export const STRIP: Rect = [840, 335, 1350, 455];
export const STAIR: Rect = [765, 455, 840, 765];

/* ---- Escalones (cada uno baja 25 cm: 4 peldaños = 1 m) ----------------------- */

/** Junto a los coches: líneas de peldaño (sx), tramo recto de sy 20 a 300 y giro alrededor de (840, 300). */
export const CAR_STEPS = { lines: [790, 798.3, 806.7, 815], top: 20, bottom: 300, center: [840, 300] as SPt };

/* ---- Piscina y depuradora --------------------------------------------------- */

/** Piscina, más pegada a la valla del lindero superior que en el boceto (sy 110 -> 51). */
export const POOL = {
  outer: [450, 51, 715, 201] as Rect,
  inner: [462, 63, 703, 189] as Rect,
  /** Profundidad del vaso (m), lámina de agua bajo la coronación (m) y grosor de la coronación (m). */
  depth: 1.5,
  waterBelow: 0.08,
  coping: 0.03,
};

/** Depuradora: caseta de 1 m de alto sobre el jardín (desplazada de sx 210 a 280 para quedar dentro del nuevo lindero). */
export const PUMP = { rect: [280, 55, 340, 111] as Rect, height: 1 };

/* ---- Cristalera en el borde de la terraza ----------------------------------- */

/**
 * Cristalera de la terraza: todo el borde hacia la piscina y el lado del
 * jardín junto al arranque de la escalera, hasta el peldaño a cota de terraza.
 * La escalera lleva también cristal en el tramo que sube por encima de la terraza.
 */
export const GLASS_RAIL = { points: [[diagonalX(TERRACE_EDGE), TERRACE_EDGE], [765, TERRACE_EDGE]] as readonly SPt[], height: 1, stairHeight: 0.9 };

/* ---- Elementos sin aclarar, dibujados tal cual en el boceto ------------------ */

/**
 * Barra rayada entre coches y franja. Cae justo en el desnivel de 1 m entre
 * ambas: se dibuja como el muro de ese desnivel, con el rayado encima.
 */
export const HATCH: Rect = [880, 323, 1105, 347];
/**
 * Marcas pequeñas junto a la casa: cajas bajas genéricas. La primera cae dentro
 * de la planta baja; la segunda, tras el nuevo lindero, queda fuera de la parcela.
 */
export const MARKS: readonly { rect: Rect; level: 'garden' | 'outside' }[] = [
  { rect: [880, 457, 900, 475], level: 'garden' },
  { rect: [842, 708, 864, 726], level: 'outside' },
];
/** Saliente en el lindero superior (fuera de la parcela) con su cuadrado interior. */
export const OUTCROP = { outer: [925, -28, 985, 20] as Rect, inner: [943, -14, 965, 8] as Rect };
/** Altura de las cajas genéricas (m). */
export const GENERIC_HEIGHT = 0.3;

/* ---- Cerramiento -------------------------------------------------------------- */

/** Muro de 1 m sobre el suelo interior y 50 cm de valla metálica grafito encima. */
export const BOUNDARY = { thickness: 0.2, wall: 1, fence: 0.5 };

/**
 * Tramos del cerramiento con la cota del suelo interior. Donde la fachada está
 * en el lindero no hay muro, y en el frente de los coches va el portón (GATE).
 */
export const BOUNDARY_RUNS: readonly { points: readonly SPt[]; level: number }[] = [
  { points: [[165, 20], [815, 20]], level: LEVELS.garden },
  { points: [[1105, 20], [1105, 335]], level: LEVELS.raised },
  { points: [[1105, 335], [1350, 335], [1350, 455]], level: LEVELS.garden },
  { points: [BATH_CORNER, [765, diagonalY(765)]], level: LEVELS.garden },
  { points: [[765, diagonalY(765)], [diagonalX(TERRACE_EDGE), TERRACE_EDGE]], level: LEVELS.raised },
  { points: [[diagonalX(TERRACE_EDGE), TERRACE_EDGE], DIAGONAL.from], level: LEVELS.garden },
];

/**
 * Portón de entrada en el frente de los coches, del mismo material que la
 * puerta de la planta baja, a la altura del cerramiento y con pilares de obra.
 */
export const GATE = { from: [815, 20] as SPt, to: [1105, 20] as SPt, thickness: 0.06, pillar: 0.3 };

/**
 * Calle del pueblo por la que entran los coches: sigue el lindero del portón
 * por fuera, a la cota `outside`. Anchos (m) desde el lindero hacia fuera:
 * acera (con la arqueta del saliente), bordillo y calzada con línea central
 * discontinua. Frente al portón el bordillo está rebajado (vado). Acera y
 * calzada van `lift` m por encima del terreno para que no parpadeen con él.
 */
export const STREET = { sidewalk: 1.4, kerb: 0.15, kerbHeight: 0.12, road: 5, line: 0.12, dash: 3, gap: 4, lift: 0.004 };

/* ---- Barbacoa -------------------------------------------------------------------- */

/**
 * Barbacoa de gas con carro en la franja, justo enfrente de la ventana de la
 * planta baja y de espaldas a la casa. Metros; `gap`: de su trasera a la fachada.
 */
export const BBQ = { gap: 1.0, width: 1.0, depth: 0.55, body: 0.8, top: 0.12, lid: 0.25, shelf: 0.3 };

/* ---- Vida en el patio ------------------------------------------------------------ */

export type Pose = 'standing' | 'sitting' | 'lying' | 'swimming';

/** Colores (hex) de una figura y qué cubre la ropa de las piernas. */
export interface Outfit {
  skin: number; hair: number; top: number; bottom: number; shoes: number;
  legs: 'bare' | 'shorts' | 'trousers';
  longHair?: boolean;
  /** Barba (mismo color que el pelo). */
  beard?: boolean;
}

/**
 * Tumbonas en el césped entre la piscina y la terraza (centro en el boceto;
 * metros), a más de 1 m de la valla en diagonal.
 */
export const LOUNGERS = { at: [[600, 300], [680, 300]] as readonly SPt[], length: 1.9, width: 0.65 };
/** Terraza: mesita redonda con dos sillas enfrentadas (centros en el boceto). */
export const TERRACE_SET = { table: [690, 425] as SPt, chairs: [[690, 395], [690, 457]] as readonly SPt[] };
/** Persona en la piscina: da vueltas alrededor de su centro. */
export const SWIMMER: SPt = [(POOL.inner[0] + POOL.inner[2]) / 2, (POOL.inner[1] + POOL.inner[3]) / 2];

/** Ropa: chico de la barbacoa, dos chicas al sol, quien nada y los dos de la terraza (guest1: hombre de pelo blanco con barba). */
export const OUTFITS: Record<'griller' | 'sunbather1' | 'sunbather2' | 'swimmer' | 'guest1' | 'guest2', Outfit> = {
  griller: { skin: 0xc58b62, hair: 0x2e221b, top: 0x3b6ea5, bottom: 0xd2c19f, shoes: 0x2b2b2b, legs: 'shorts' },
  sunbather1: { skin: 0xe9b893, hair: 0xcfa760, top: 0xe0605a, bottom: 0xe0605a, shoes: 0xe9b893, legs: 'bare', longHair: true },
  sunbather2: { skin: 0x8a5a3c, hair: 0x15120f, top: 0x2a9d8f, bottom: 0x2a9d8f, shoes: 0x8a5a3c, legs: 'bare', longHair: true },
  swimmer: { skin: 0xe2ad86, hair: 0x5a3b26, top: 0x1f3b73, bottom: 0x1f3b73, shoes: 0xe2ad86, legs: 'bare' },
  guest1: { skin: 0xe9b893, hair: 0xf4f3ef, top: 0x4b5320, bottom: 0x2c3a55, shoes: 0x6b4a32, legs: 'trousers', beard: true },
  guest2: { skin: 0xc58b62, hair: 0x2e221b, top: 0xe8c547, bottom: 0x3a3f46, shoes: 0x2b2b2b, legs: 'trousers', longHair: true },
};

/* ---- Moto ------------------------------------------------------------------------ */

/**
 * Harley-Davidson azul aparcada junto al costado izquierdo del coche, mirando
 * también a la casa y apoyada en la pata de cabra (`lean`, rad).
 */
export const MOTORCYCLE = { center: [945, 200] as SPt, lean: 0.12 };

/* ---- Coche ---------------------------------------------------------------------- */

/**
 * Citroën C3 aparcado de frente (hacia la casa) en el lado derecho de la zona
 * de coches, dejando sitio para otro. Medidas reales en metros; centro en
 * unidades del boceto. Blanco con techo negro.
 */
export const CAR = {
  center: [1040, 180] as SPt,
  length: 4.0, width: 1.75, height: 1.5, wheelbase: 2.54, wheelRadius: 0.32,
  body: 0xf2f2ef, roof: 0x16181a,
};

/* ---- Escalera exterior ---------------------------------------------------------- */

/**
 * Arranca junto a la franja (se llega desde los coches) y sube pegada a la
 * fachada SE hasta un rellano frente a la puerta de entrada (a la altura del
 * piso). El ancho es el del boceto salvo donde el muro del lindero se acerca:
 * ahí peldaños y rellano llegan hasta el muro. `maxRiser`: tabica máxima (m);
 * `landingMargin`: lo que sobresale el rellano a cada lado de la puerta (m).
 */
export const OUTDOOR_STAIR = { maxRiser: 0.2, landingMargin: 0.1, entranceDoor: [405, 500] as readonly [Px, Px] };
