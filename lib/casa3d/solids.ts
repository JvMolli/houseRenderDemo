/**
 * Sólidos de cada grupo de la maqueta, derivados de plan.ts.
 * Para cambiar la distribución se edita plan.ts, no esto.
 */
import {
  ARMCHAIRS, BAR, BATHROOM, BATHROOM_CYLS, BEDS, CHAMFER_WALL, CLOSETS, GROUND_DOOR_BOXES, GROUND_WINDOW_BOXES,
  KITCHEN, KITCHEN_CYLS, LIVING, STOOLS, WALL_PIECES, WALLS,
} from './plan';
import { armchair, bed, chamferWall, closet, cyl, mbox, pbox, stool, wallBoxes, type Solid } from './shapes';

/** Puerta y ventanita de la planta baja con sus marcos (en la escena, no en el piso). */
export const GROUND_FLOOR_SOLIDS: readonly Solid[] = [...GROUND_DOOR_BOXES, ...GROUND_WINDOW_BOXES].map(mbox);

/** Grupo de muros: baja a 0,4 de altura con "Bajar paredes". */
export const WALL_SOLIDS: readonly Solid[] = [
  ...WALLS.flatMap(wallBoxes).map(pbox),
  ...WALL_PIECES.map(pbox),
  chamferWall(CHAMFER_WALL.from, CHAMFER_WALL.to, CHAMFER_WALL.thickness),
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
