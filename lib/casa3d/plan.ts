/**
 * Distribución del piso: todas las coordenadas de la maqueta.
 * Los números coinciden 1:1 con casa-3d.html. Salvo que se indique lo
 * contrario, x/z van en px del plano (ver units.ts) y las alturas en metros.
 */
import { HT, OX, OZ, S, X, Z, type Px, type Vec3 } from './units';

export type MaterialKey =
  | 'white' | 'wood' | 'stone' | 'black' | 'wall' | 'line' | 'cushion' | 'sofa'
  | 'rug' | 'linen' | 'throw' | 'tub' | 'door' | 'frost' | 'table' | 'steel'
  | 'glass' | 'led' | 'screen' | 'facade' | 'handle' | 'shelf' | 'slate' | 'stoneBowl' | 'plant' | 'oakMedium' | 'showerGlass'
  | 'mirror' | 'garageDoor' | 'graphite' | 'poolTile' | 'tinted' | 'kerb' | 'cabinet' | 'facadeUpper';

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
/** Modo videojuego: el campo (y la calle) llegan hasta ±TERRAIN_HALF m del centro del terreno. */
export const TERRAIN_HALF = 130;

/** Esquinas del terreno en px del plano (x1, z1, x2, z2). */
export const GROUND_RECT: Rect = [
  OX + (GROUND.position[0] - GROUND.size / 2) * S, OZ + (GROUND.position[2] - GROUND.size / 2) * S,
  OX + (GROUND.position[0] + GROUND.size / 2) * S, OZ + (GROUND.position[2] + GROUND.size / 2) * S,
];

/**
 * Puerta de la planta baja (un apartamento, no un garaje) en la fachada SO,
 * centrada bajo la ventana de la barra/cocina. Medidas en metros.
 */
export const GROUND_DOOR = { center: (Z(737) + Z(897)) / 2, width: 2.8, height: 2.2 };

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

/**
 * Ventana de la planta baja en la fachada SO: igual que la del salón, que
 * queda justo encima (mismo hueco en px; alféizar y dintel en metros sobre la
 * planta baja). Se abre en un muro del mismo grosor que el del piso.
 */
export const GROUND_WINDOW: Opening = { a: 268, b: 552, s: 0.8, h: 2.3, w: true };
/** Grosor del muro de la fachada SO (px), como el del piso. */
export const GROUND_SO_WALL = [45, 78] as const;

/** Brújula: arriba del plano = NO (azimut 315°), ventanas del salón al SO. */
export const COMPASS = { position: [X(45) - 1.3, 0.02, Z(52) + 1.2] as Vec3, rotationY: -Math.PI / 4, size: 1.8 };

/* =====================================================================
   PISO (primera planta): suelos
   ===================================================================== */

/** Tarima de roble del baño (y = 0.004 m sobre el porcelánico). */
export const BATH_FLOOR = { points: [[522, 942], [870, 942], [640, 1232], [522, 1232]] as readonly Pt[], y: 0.004 };
/** Plato de ducha de obra en pizarra, recortado por el chaflán. */
export const SHOWER_FLOOR = { points: [[712, 944], [868, 944], [868, 990], [801, 1062], [712, 1062]] as readonly Pt[], y: 0.008 };

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
  [78, 897, 149, 932, 0, 2.4, 'cabinet'],                                                           // columna pegada a la pared
  [78, 934, 149, 1016, 0, 0.845, 'cabinet'], [78, 934, 149, 1016, 0.855, 1.995, 'cabinet'], [78, 934, 149, 1016, 2.005, 2.4, 'cabinet'], // nevera panelada
  [149, 972, 151, 974, 0.95, 1.6, 'steel'],
  [78, 1017, 149, 1161, 0, 0.86, 'cabinet'],                                                        // bajos pared SO (placa + horno)
  [78, 1161, 316, 1232, 0, 0.86, 'cabinet'],                                                        // bajos bajo ventana (fregadero)
  [316, 1042, 387, 1232, 0, 0.86, 'cabinet'],                                                       // retorno con cajones
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
  [78, 1016, 125, 1161, 2.15, 2.4, 'cabinet'],
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
  { id: 'bano', label: 'Baño', src: '/fotos/bano.jpg', width: 941, height: 1672, x: 640, z: 1110, y: 1.5 },
  // Exterior: sobre el césped del patio, entre la piscina y la terraza (y negativa: por debajo del piso)
  { id: 'exterior', label: 'Exterior: casa, patio y piscina', src: '/fotos/exterior.png', width: 1900, height: 828, x: -590, z: 1836, y: -0.8 },
  // Garaje: sobre la zona de coches, entre el C3 y la Harley
  { id: 'garaje', label: 'Garaje: Citroën, Harley y barbacoa', src: '/fotos/garaje.png', width: 1899, height: 828, x: -779, z: 901, y: 0 },
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

/*
 * Baño según la foto: entrando por la puerta (pared oeste) y mirando al
 * chaflán, mueble doble suspendido a la izquierda (pared norte), ducha de obra
 * al fondo y listones de roble a la derecha (pared sur) tras el inodoro.
 */

/** Revestimiento de pizarra en las caras del baño (grupo de muros: baja con las paredes). */
export const BATH_CLADDING: readonly Box[] = [
  [522, 942, 868, 944, 0, HT, 'slate'],                                                           // pared norte
  [522, 944, 524, 1048, 0, HT, 'slate'], [522, 1150, 524, 1230, 0, HT, 'slate'], [522, 1048, 524, 1150, 2.1, HT, 'slate'], // oeste (puerta)
  [868, 944, 870, 990, 0, HT, 'slate'],                                                           // machón junto al chaflán
  // Pared sur: listones verticales de roble sobre fondo negro
  [524, 1230, 636, 1232, 0, HT, 'black'],
  ...Array.from({ length: 19 }, (_, i): Box => [526 + i * 6, 1226.5, 529.6 + i * 6, 1230, 0, HT, 'oakMedium']),
];
/** Revestimiento de pizarra sobre el muro en chaflán (fracción t0..t1 de su largo, lado del baño). */
export const BATH_CHAMFER_CLADDING = { t0: 0.31, t1: 0.98, thickness: 0.017 };

export const BATHROOM: readonly Box[] = [
  // Mueble de roble suspendido, doble, con encimera de roble, juntas de cajones y LED debajo
  [532, 944, 702, 1004, 0.32, 0.8, 'oakMedium'], [530, 944, 704, 1007, 0.8, 0.85, 'oakMedium'],
  [532, 1004, 702, 1005, 0.555, 0.565, 'black'], [616, 1004, 618, 1005, 0.32, 0.8, 'black'],
  [536, 1000, 698, 1004, 0.305, 0.315, 'led'],
  // Ducha: sumidero lineal, mampara fija con perfiles negros y barra estabilizadora
  [722, 948, 858, 952, 0.008, 0.014, 'black'],
  [711, 944, 713, 1040, 0.04, 2.0, 'showerGlass'], [709, 944, 715, 1040, 0, 0.04, 'black'],
  [710, 1038, 714, 1042, 0, 2.0, 'black'], [714, 1039, 822, 1041, 1.97, 1.99, 'black'],
  // Columna termostática y rociador de techo, negros
  [862, 958, 868, 998, 1.06, 1.12, 'black'], [863, 976, 867, 980, 1.12, 2.1, 'black'],
  [762, 966, 822, 1026, 2.22, 2.24, 'black'], [790, 994, 794, 998, 2.24, 2.6, 'black'],
  // Hornacina de la ducha con luz cálida
  [810, 944, 812, 956, 1.0, 1.5, 'slate'], [856, 944, 858, 956, 1.0, 1.5, 'slate'],
  [810, 944, 858, 956, 1.48, 1.5, 'slate'], [810, 944, 858, 956, 1.0, 1.02, 'slate'],
  [812, 945, 856, 949, 1.465, 1.48, 'led'],
  // Inodoro suspendido y pulsador
  [566, 1206, 594, 1226, 0.2, 0.42, 'tub'], [570, 1225, 590, 1226.5, 0.95, 1.12, 'black'],
];

export const BATHROOM_CYLS: readonly Cyl[] = [
  [580, 1188, 0.18, 0.2, 0.22, 'tub'],                                                            // taza del inodoro
  [822, 950, 0.025, 1.02, 0.18, 'black'], [832, 951, 0.02, 1.02, 0.14, 'stoneBowl'],              // botes de la hornacina
  [846, 950, 0.03, 1.02, 0.06, 'white'], [846, 950, 0.05, 1.08, 0.08, 'plant'],                   // planta de la hornacina
  [617, 952, 0.025, 0.85, 0.15, 'black'],                                                         // dosificador
];

/**
 * Lavabos de piedra sobre encimera, grifos negros altos y espejos redondos
 * retroiluminados: centros en x (px) del mueble; altura y radios en metros.
 */
export const BATH_SINKS = {
  x: [574, 660] as readonly Px[], z: 975, faucetZ: 952, top: 0.85, bowlRadius: 0.2,
  mirror: { y: 1.55, radius: 0.3, wallZ: 944 },
};

/** Luces de ambiente del baño (con «Encender luces»): bajo el mueble y en los espejos. */
export const BATH_ACCENT_LIGHTS: readonly { x: Px; z: Px; y: number; intensity: number; distance: number }[] = [
  { x: 617, z: 990, y: 0.2, intensity: 0.8, distance: 1.4 },
  { x: 617, z: 962, y: 1.55, intensity: 1.2, distance: 2.2 },
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
  { label: 'Baño', position: [3.85, 4.6, 9.45], target: [6.2, 4.05, 7.75] },
];

const view = (label: string) => VIEWS.find(v => v.label === label)!;

/** Paradas del modo tour, en orden: de la parcela al baño y vuelta a la vista general. */
export const TOUR: readonly CameraView[] = [
  { ...view('Parcela'), label: 'La parcela' },
  { label: 'Entrada', position: [-19, 3.6, 11.5], target: [-11.6, 1.6, 7.66] },
  { label: 'Coche y moto', position: [-10.5, 3.0, 9.8], target: [-6.5, 1.6, 6.5] },
  { label: 'Barbacoa', position: [-2.4, 1.9, 5.8], target: [-1.9, 1.1, 2.9] },
  { label: 'Piscina y tumbonas', position: [-2.5, 4.5, 18.5], target: [-7.5, 0.2, 14.5] },
  { label: 'Terraza', position: [-3.6, 3.0, 14.6], target: [0.1, 1.6, 12.4] },
  { label: 'Escalera de entrada', position: [-2.6, 1.8, 10.6], target: [3.0, 3.2, 10.8] },
  view('Salón'),
  view('Cocina'),
  { label: 'Dormitorio', position: [5.0, 4.6, 3.6], target: [6.3, 3.6, 0.8] },
  view('Baño'),
  { ...view('General'), label: 'Vista general' },
];
