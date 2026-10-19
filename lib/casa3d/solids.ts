/**
 * Sólidos de cada grupo de la maqueta, derivados de plan.ts.
 * Para cambiar la distribución se edita plan.ts, no esto.
 */
import {
  ARMCHAIRS, BAR, BATH_CHAMFER_CLADDING, BATH_CLADDING, BATHROOM, BATHROOM_CYLS, BEDS, CHAMFER_WALL, CLOSETS, GROUND_DOOR_BOXES, GROUND_SO_WALL, GROUND_WINDOW,
  KITCHEN, KITCHEN_CYLS, LIVING, STOOLS, WALL_PIECES, WALLS,
} from './plan';
import { armchair, bed, chamferWall, closet, cyl, mbox, pbox, stool, wallBoxes, wallFacing, type Solid } from './shapes';
import { HT } from './units';

const [so1, so2] = GROUND_SO_WALL, gw = GROUND_WINDOW;

/** Puerta y ventana de la planta baja (en la escena, no en el piso). */
export const GROUND_FLOOR_SOLIDS: readonly Solid[] = [
  ...GROUND_DOOR_BOXES.map(mbox),
  // Carpintería y vidrio como las ventanas del piso (el muro ya lo pone el bloque de la planta baja)
  ...wallBoxes(['v', so1, so2, gw.a, gw.b, [gw]]).filter(b => b[6] !== 'wall').map(pbox),
  // Fondo del hueco: interior en penumbra
  pbox([so2 - 2, gw.a, so2, gw.b, gw.s, gw.h, 'door']),
];

/** Grupo de muros: baja a 0,4 de altura con "Bajar paredes". */
export const WALL_SOLIDS: readonly Solid[] = [
  ...WALLS.flatMap(wallBoxes).map(pbox),
  ...WALL_PIECES.map(pbox),
  chamferWall(CHAMFER_WALL.from, CHAMFER_WALL.to, CHAMFER_WALL.thickness),
  ...BATH_CLADDING.map(pbox),
  // Pizarra en la cara del chaflán que da al baño (a la derecha yendo de from a to)
  wallFacing(CHAMFER_WALL.from, CHAMFER_WALL.to, -(CHAMFER_WALL.thickness + BATH_CHAMFER_CLADDING.thickness) / 2,
    BATH_CHAMFER_CLADDING.thickness, BATH_CHAMFER_CLADDING.t0, BATH_CHAMFER_CLADDING.t1, 0, HT, 'slate'),
];

export const KITCHEN_SOLIDS: readonly Solid[] = [
  ...BAR.map(pbox),
  ...STOOLS.flatMap(stool).map(cyl),
  ...KITCHEN.map(pbox),
  ...KITCHEN_CYLS.map(cyl),
];

export const LIVING_SOLIDS: readonly Solid[] = [...LIVING, ...ARMCHAIRS.flatMap(armchair)].map(pbox);

export const BEDROOM_SOLIDS: readonly Solid[] = [...CLOSETS.flatMap(closet), ...BEDS.flatMap(bed)].map(pbox);

export const BATHROOM_SOLIDS: readonly Solid[] = [...BATHROOM.map(pbox), ...BATHROOM_CYLS.map(cyl)];
