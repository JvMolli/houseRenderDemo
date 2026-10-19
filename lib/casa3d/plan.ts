/**
 * Distribución del piso: todas las coordenadas de la maqueta.
 * Los números coinciden 1:1 con casa-3d.html. Salvo que se indique lo
 * contrario, x/z van en px del plano (ver units.ts) y las alturas en metros.
 */
import { HT, X, Z, type Px, type Vec3 } from './units';

export type MaterialKey =
  | 'white' | 'wood' | 'stone' | 'black' | 'wall' | 'line' | 'cushion' | 'sofa'
  | 'rug' | 'linen' | 'throw' | 'tub' | 'door' | 'frost' | 'table' | 'steel'
  | 'glass' | 'led' | 'screen' | 'facade' | 'handle' | 'shelf' | 'basin'
  | 'mirror' | 'tubWater' | 'garageDoor' | 'graphite' | 'poolTile';

/** B(): caja por rectángulo del plano (px) y alturas (m). */
export type Box = readonly [x1: Px, z1: Px, x2: Px, z2: Px, y0: number, y1: number, mat: MaterialKey];
/** box(): caja por tamaño y esquina mínima, todo en metros. */
export type MBox = readonly [w: number, h: number, d: number, x: number, y: number, z: number, mat: MaterialKey];
/** cyl(): cilindro vertical con centro en el plano (px), radio, base y altura (m). */
export type Cyl = readonly [px: Px, pz: Px, r: number, y0: number, h: number, mat: MaterialKey];
export type Pt = readonly [x: Px, z: Px];
/** Rectángulo del plano (px). */
export type Rect = readonly [x1: Px, z1: Px, x2: Px, z2: Px];

/** Hueco en un muro: a..b en px a lo largo del muro, s = alféizar, h = dintel (m). */
export interface Opening {
  a: Px;
  b: Px;
  s: number;
  h: number;
  /** Ventana: vidrio + carpintería. */
  w?: true;
  /** Puerta opaca con vidrio esmerilado. */
  d?: true;
}

/**
 * wall(): 'h' = muro a lo largo de X (grosor a1..a2 en Z), 'v' = a lo largo de Z
 * (grosor a1..a2 en X). c1..c2 = extensión del muro.
 */
export type Wall = readonly [dir: 'h' | 'v', a1: Px, a2: Px, c1: Px, c2: Px, ops?: readonly Opening[]];

/* =====================================================================
   EXTERIOR Y PLANTA BAJA (apartamento)
   ===================================================================== */

/** Contorno exterior (con chaflán). */
export const FP: readonly Pt[] = [[45, 52], [1005, 52], [1005, 900], [650, 1265], [45, 1265]];

/** Rectángulo que envuelve FP: techo de sombra. */
export const FP_BOUNDS: Rect = [
  Math.min(...FP.map(p => p[0])), Math.min(...FP.map(p => p[1])),
  Math.max(...FP.map(p => p[0])), Math.max(...FP.map(p => p[1])),
];

/** Terreno: plano de 44 x 44 m (metros). */
export const GROUND = { size: 44, position: [3.8, -0.01, 5] as Vec3 };

/**
 * Puerta de la planta baja (un apartamento, no un garaje) en la fachada SO,
 * centrada bajo la ventana de la barra/cocina. Medidas en metros.
 */
export const GROUND_DOOR = { center: (Z(737) + Z(897)) / 2, width: 2.0, height: 2.2 };

/** Puerta seccional y su marco (metros). */
export const GROUND_DOOR_BOXES: readonly MBox[] = (() => {
  const { center: c, width: w, height: h } = GROUND_DOOR;
  return [
    [0.06, h, w, X(45) - 0.06, 0, c - w / 2, 'garageDoor'],
    [0.09, 0.08, w + 0.16, X(45) - 0.09, h, c - w / 2 - 0.08, 'black'],
    [0.09, h + 0.08, 0.08, X(45) - 0.09, 0, c - w / 2 - 0.08, 'black'],
    [0.09, h + 0.08, 0.08, X(45) - 0.09, 0, c + w / 2, 'black'],
  ];
})();

/** Brújula: arriba del plano = NO (azimut 315°), ventanas del salón al SO. */
export const COMPASS = { position: [X(45) - 1.3, 0.02, Z(52) + 1.2] as Vec3, rotationY: -Math.PI / 4, size: 1.8 };

/* =====================================================================
   PISO (primera planta): suelos
   ===================================================================== */

/** Gres del baño (y = 0.004 m sobre el suelo de roble). */
export const BATH_TILES = { points: [[522, 942], [870, 942], [640, 1232], [522, 1232]] as readonly Pt[], y: 0.004 };

/* =====================================================================
   MUROS
   ===================================================================== */

export const WALLS: readonly Wall[] = [
  ['h', 52, 68, 45, 1005],                                                                        // fachada NO (pared de la TV)
  ['v', 45, 78, 68, 1232, [{ a: 268, b: 552, s: 0.8, h: 2.3, w: true }, { a: 737, b: 897, s: 1.05, h: 2.3, w: true }]], // fachada SO: ventana salón + ventana barra
  ['v', 970, 1005, 68, 900, [{ a: 198, b: 348, s: 0.9, h: 2.2, w: true }, { a: 590, b: 740, s: 0.9, h: 2.2, w: true }]], // fachada NE: ventanas dormitorios
  ['h', 1232, 1265, 45, 650, [{ a: 215, b: 283, s: 1.0, h: 2.2, w: true }, { a: 405, b: 500, s: 0, h: 2.1, d: true }]], // ventana fregadero + puerta de entrada
  ['v', 640, 650, 68, 932, [{ a: 345, b: 440, s: 0, h: HT }, { a: 757, b: 852, s: 0, h: HT }]],   // tabique salón/dormitorios (huecos de correderas hasta techo)
  ['h', 520, 532, 650, 970],                                                                      // entre dormitorios
  ['h', 932, 942, 508, 970],                                                                      // armarios/baño
  ['v', 508, 522, 862, 1232, [{ a: 1048, b: 1150, s: 0, h: 2.1 }]],                               // baño (puerta)
];

/** Resto de piezas del grupo de muros (bajan con "Bajar paredes"). */
export const WALL_PIECES: readonly Box[] = [
  [870, 942, 935, 990, 0, HT, 'wall'],
  [504, 700, 534, 735, 0, HT, 'wood'], // pilar, revestido de madera como las correderas
  // Puertas correderas de suelo a techo (medio abiertas, por el lado del salón) + guías
  [633, 392, 638, 487, 0, 2.56, 'wood'], [631, 345, 640, 535, 2.56, 2.6, 'black'], [631, 398, 633, 400, 0.9, 1.5, 'black'],
  [633, 710, 638, 805, 0, 2.56, 'wood'], [631, 662, 640, 852, 2.56, 2.6, 'black'], [631, 797, 633, 799, 0.9, 1.5, 'black'],
];

/** Muro en chaflán: de un extremo a otro del plano, grosor en metros. */
export const CHAMFER_WALL = { from: [990, 892] as Pt, to: [645, 1252] as Pt, thickness: 0.32 };

/** Techo invisible que solo proyecta sombra (grosor en metros). */
export const SHADOW_CEILING_THICKNESS = 0.06;

/* =====================================================================
   BARRA Y COCINA
   ===================================================================== */

export const BAR: readonly Box[] = [
  [78, 790, 350, 847, 0, 0.92, 'stone'], [78, 767, 377, 870, 0.92, 0.96, 'stone'],
];

export const STOOLS: readonly Pt[] = [[199, 765], [291, 765], [199, 875], [291, 875], [380, 817]];

/** Cocina en U. */
export const KITCHEN: readonly Box[] = [
  [78, 897, 149, 932, 0, 2.4, 'white'],                                                           // columna pegada a la pared
  [78, 934, 149, 1016, 0, 0.845, 'white'], [78, 934, 149, 1016, 0.855, 1.995, 'white'], [78, 934, 149, 1016, 2.005, 2.4, 'white'], // nevera panelada
  [149, 972, 151, 974, 0.95, 1.6, 'steel'],
  [78, 1017, 149, 1161, 0, 0.86, 'white'],                                                        // bajos pared SO (placa + horno)
  [78, 1161, 316, 1232, 0, 0.86, 'white'],                                                        // bajos bajo ventana (fregadero)
  [316, 1042, 387, 1232, 0, 0.86, 'white'],                                                       // retorno con cajones
  [78, 1017, 151, 1159, 0.86, 0.9, 'stone'],
  [78, 1159, 318, 1232, 0.86, 0.9, 'stone'],
  [314, 1040, 389, 1159, 0.86, 0.9, 'stone'],
  [149, 1088, 150, 1090, 0.05, 0.85, 'line'],
  ...[215, 283].map((x): Box => [x - 1, 1160, x + 1, 1161, 0.05, 0.85, 'line']),
  ...[0.3, 0.58].map((y): Box => [387, 1050, 388, 1225, y, y + 0.012, 'line']),
  [220, 1172, 278, 1222, 0.895, 0.905, 'black'],                                                  // fregadero
  [84, 1060, 144, 1125, 0.9, 0.912, 'black'],                                                     // placa
  [149, 1063, 151, 1122, 0.12, 0.72, 'black'],                                                    // horno
  [78, 1016, 80, 1232, 0.9, 1.5, 'stone'], [80, 1230, 316, 1232, 0.9, 1.0, 'stone'], [80, 1230, 213, 1232, 1.0, 1.5, 'stone'], // frontal
  [80, 1016, 120, 1161, 1.5, 2.15, 'wood'], [120, 1087, 121, 1089, 1.5, 2.15, 'handle'],         // altos de roble
  [112, 1016, 114, 1161, 1.49, 1.5, 'led'],                                                       // LED bajo altos
  [78, 1016, 125, 1161, 2.15, 2.4, 'white'],
];

export const KITCHEN_CYLS: readonly Cyl[] = [
  [249, 1226, 0.012, 0.9, 0.32, 'black'],                                                         // grifo
];

/* =====================================================================
   SALÓN
   ===================================================================== */

export const LIVING: readonly Box[] = [
  [220, 68, 488, 108, 0, 0.45, 'white'],                                                          // mueble TV
  [275, 68, 433, 71, 1.0, 1.62, 'black'], [277, 71, 431, 72, 1.03, 1.59, 'screen'],              // TV
  [165, 68, 212, 112, 0.45, 2.2, 'wood'],                                                         // hornacina
  ...[0.85, 1.25, 1.65].map((y): Box => [167, 70, 210, 112, y, y + 0.02, 'shelf']),
  [220, 197, 488, 425, 0, 0.012, 'rug'],                                                          // alfombra
  [295, 340, 412, 400, 0, 0.38, 'table'],                                                         // mesa de centro
  [220, 440, 488, 530, 0, 0.42, 'sofa'], [220, 528, 488, 553, 0, 0.82, 'sofa'],                  // sofá
  ...[0, 1, 2].map((i): Box => [223 + i * 89, 445, 306 + i * 89, 526, 0.42, 0.5, 'cushion']),
];

/** Butacas: rectángulo y si el respaldo va a la izquierda (x1). */
export const ARMCHAIRS: readonly (readonly [...Rect, backLeft: boolean])[] = [
  [123, 258, 213, 335, true], [123, 343, 213, 420, true], [497, 258, 585, 335, false], [497, 343, 585, 420, false],
];

/** Halo del ambilight: centro en x (px), y y z en metros, tamaño en metros. */
export const AMBILIGHT = { x: 354, y: 1.31, z: 0.004, size: [2.6, 1.3] as const };

/** Luces del ambilight: x en px, y y z en metros. */
export const AMBILIGHT_LIGHTS: readonly { x: Px; y: number; z: number; color: number }[] = [
  { x: 285, y: 1.3, z: 0.3, color: 0x3a8cff },
  { x: 423, y: 1.3, z: 0.3, color: 0xff9040 },
];

/* =====================================================================
   LUCES DE TECHO (botón "Encender luces"): centro de cada estancia en px
   ===================================================================== */

export const CEILING_LIGHTS: readonly { room: string; x: Px; z: Px }[] = [
  { room: 'salón (alfombra)', x: 354, z: 311 },
  { room: 'salón (paso a la barra)', x: 354, z: 660 },
  { room: 'barra', x: 228, z: 818 },
  { room: 'cocina', x: 230, z: 1060 },
  { room: 'recibidor', x: 452, z: 1100 },
  { room: 'dormitorio 1', x: 810, z: 290 },
  { room: 'dormitorio 2', x: 810, z: 697 },
  { room: 'baño', x: 660, z: 1060 },
];

/* =====================================================================
   FOTOS: icono flotante en la maqueta que abre la imagen
   x/z en px del plano, y en metros sobre el suelo del piso
   ===================================================================== */

export interface Photo {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
  x: Px;
  z: Px;
  y: number;
}

export const PHOTOS: readonly Photo[] = [
  { id: 'salon', label: 'Salón visto desde la cocina', src: '/fotos/salon.jpg', width: 1122, height: 1402, x: 354, z: 300, y: 1.5 },
];

/* =====================================================================
   ARMARIOS Y DORMITORIOS
   ===================================================================== */

/** Armarios: rectángulo y número de módulos. */
export const CLOSETS: readonly (readonly [...Rect, n: number])[] = [
  [522, 862, 638, 932, 2], [650, 452, 970, 520, 4], [650, 862, 945, 932, 4],
];

export const BEDS: readonly Rect[] = [[722, 75, 900, 312], [722, 537, 900, 775]];

/* =====================================================================
   BAÑO
   ===================================================================== */

export const BATHROOM: readonly Box[] = [
  [524, 945, 620, 997, 0, 0.82, 'wood'], [522, 942, 622, 1000, 0.82, 0.86, 'tub'], [540, 955, 604, 988, 0.86, 0.875, 'basin'], // lavabo
  [535, 942, 610, 944, 1.1, 1.8, 'mirror'],                                                       // espejo
  [633, 948, 835, 1032, 0, 0.55, 'tub'], [643, 958, 825, 1022, 0.42, 0.556, 'tubWater'],         // bañera
  [566, 1210, 600, 1232, 0, 0.8, 'tub'],                                                          // inodoro
];

export const BATHROOM_CYLS: readonly Cyl[] = [
  [583, 1188, 0.17, 0, 0.42, 'tub'],                                                              // inodoro
];

/* =====================================================================
   VISTAS DE CÁMARA (metros), en el orden de los botones
   ===================================================================== */

export interface CameraView {
  label: string;
  position: Vec3;
  target: Vec3;
}

export const VIEWS: readonly CameraView[] = [
  { label: 'General', position: [-4, 13, 16], target: [3.8, 2.5, 5] },
  { label: 'Fachada', position: [-10.3, 3.2, 9.5], target: [-0.3, 2.6, 4.84] },
  { label: 'Salón', position: [3.21, 4.6, 7.33], target: [1.87, 4.0, 0.69] },
  { label: 'Cocina', position: [3.13, 4.7, 4.47], target: [1.28, 3.9, 9.09] },
  { label: 'Planta', position: [3.8, 17.5, 5.01], target: [3.8, 3, 5] },
  { label: 'Parcela', position: [-20, 22, 32], target: [-1.9, 0, 11.7] },
];
