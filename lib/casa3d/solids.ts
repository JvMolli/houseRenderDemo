/**
 * Sólidos de cada grupo de la maqueta, derivados de plan.ts.
 * Para cambiar la distribución se edita plan.ts, no esto.
 */
import {
  ARMCHAIRS, BAR, FP, BATH_CHAMFER_CLADDING, BATH_CLADDING, BATHROOM, BATHROOM_CYLS, BEDS, CHAMFER_WALL, CLOSETS, GROUND_DOOR_BOXES, GROUND_SO_WALL, GROUND_WINDOW,
  KITCHEN, KITCHEN_CYLS, LIVING, STOOLS, WALL_PIECES, WALLS,
} from './plan';
import { armchair, bed, chamferWall, closet, cyl, insidePolygon, mbox, pbox, stool, wallBoxes, wallFacing, type Solid } from './shapes';
import { HT, OX, OZ, S } from './units';

const [so1, so2] = GROUND_SO_WALL, gw = GROUND_WINDOW;

/** Puerta y ventana de la planta baja (en la escena, no en el piso). */
export const GROUND_FLOOR_SOLIDS: readonly Solid[] = [
  ...GROUND_DOOR_BOXES.map(mbox),
  // Carpintería y vidrio como las ventanas del piso (el muro ya lo pone el bloque de la planta baja)
  ...wallBoxes(['v', so1, so2, gw.a, gw.b, [gw]]).filter(b => b[6] !== 'wall').map(pbox),
  // Fondo del hueco: interior en penumbra
  pbox([so2 - 2, gw.a, so2, gw.b, gw.s, gw.h, 'door']),
];

/** Normales de las caras de BoxGeometry, en su orden: +X, -X, +Y, -Y, +Z, -Z. */
const FACE_NORMALS = [[1, 0], [-1, 0], [0, 0], [0, 0], [0, 1], [0, -1]] as const;

/**
 * Muro exterior: la cara que da fuera de la huella del piso lleva el material
 * de la fachada de la planta alta; las demás, el de las paredes.
 */
function withFacade(s: Solid): Solid {
  if (s.kind !== 'box' || s.mat !== 'wall') return s;
  const c = Math.cos(s.rotationY ?? 0), sn = Math.sin(s.rotationY ?? 0);
  const faceMats = FACE_NORMALS.map(([nx, nz], i) => {
    if (!nx && !nz) return undefined;
    // 5 cm por fuera del centro de la cara, con el giro de la caja
    const d = s.size[Math.floor(i / 2)] / 2 + 0.05, lx = nx * d, lz = nz * d;
    const x = s.position[0] + lx * c + lz * sn, z = s.position[2] - lx * sn + lz * c;
    return insidePolygon([OX + x * S, OZ + z * S], FP) ? undefined : 'facadeUpper' as const;
  });
  return faceMats.some(Boolean) ? { ...s, faceMats } : s;
}

/** Grupo de muros: baja a 0,4 de altura con "Bajar paredes". */
export const WALL_SOLIDS: readonly Solid[] = [
  ...WALLS.flatMap(wallBoxes).map(pbox),
  ...WALL_PIECES.map(pbox),
  chamferWall(CHAMFER_WALL.from, CHAMFER_WALL.to, CHAMFER_WALL.thickness),
  ...BATH_CLADDING.map(pbox),
  // Pizarra en la cara del chaflán que da al baño (a la derecha yendo de from a to)
  wallFacing(CHAMFER_WALL.from, CHAMFER_WALL.to, -(CHAMFER_WALL.thickness + BATH_CHAMFER_CLADDING.thickness) / 2,
    BATH_CHAMFER_CLADDING.thickness, BATH_CHAMFER_CLADDING.t0, BATH_CHAMFER_CLADDING.t1, 0, HT, 'slate'),
].map(withFacade);

export const KITCHEN_SOLIDS: readonly Solid[] = [
  ...BAR.map(pbox),
  ...STOOLS.flatMap(stool).map(cyl),
  ...KITCHEN.map(pbox),
  ...KITCHEN_CYLS.map(cyl),
];

export const LIVING_SOLIDS: readonly Solid[] = [...LIVING, ...ARMCHAIRS.flatMap(armchair)].map(pbox);

export const BEDROOM_SOLIDS: readonly Solid[] = [...CLOSETS.flatMap(closet), ...BEDS.flatMap(bed)].map(pbox);

export const BATHROOM_SOLIDS: readonly Solid[] = [...BATHROOM.map(pbox), ...BATHROOM_CYLS.map(cyl)];
