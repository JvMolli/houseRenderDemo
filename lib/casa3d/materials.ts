/**
 * Materiales de la maqueta: una sola instancia de cada uno, compartida por
 * todas las piezas. Las texturas de canvas se generan aquí una sola vez.
 */
import * as THREE from 'three';
import type { MaterialKey } from './plan';
import { HATCH } from './parcel';
import { sketchRectCenter } from './parcelShapes';
import * as tex from './textures';

/** Lado de la baldosa del porcelánico del piso (m). */
export const FLOOR_TILE = 0.6;
/** Lado (m) que cubre un canvas de pavimento exterior. */
const PAVER = 2.4;

/** Materiales que no se usan en cajas del plano. */
export type ExtraMaterialKey =
  | 'floor' | 'tile' | 'ground' | 'compass' | 'ambilight' | 'ceiling' | 'sun'
  | 'grass' | 'terracePaving' | 'carsPaving' | 'stripPaving' | 'water' | 'hatch';
export type Materials = Record<MaterialKey | ExtraMaterialKey, THREE.Material>;

/** Crea todos los materiales. Llamar solo en cliente; liberar con disposeMaterials(). */
export function createMaterials(anisotropy: number): Materials {
  let seed = 0;
  const rnd = () => tex.mulberry32(++seed);

  // Textura de color: sRGB (desde r152 la salida es sRGB).
  const plain = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const tx = (c: HTMLCanvasElement, rx = 1, ry = 1) => {
    const t = plain(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = anisotropy;
    return t;
  };
  const MT = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.75, ...o });
  const M = (color: number) => MT({ color });
  const basic = (o: THREE.MeshBasicMaterialParameters) => new THREE.MeshBasicMaterial(o);

  const hatchSize = sketchRectCenter(HATCH, 0).size;

  // Porcelánico beige claro de 60 x 60 cm: las UV de ShapeGeometry van en metros.
  const floorMap = tx(tex.porcelain(rnd()), 1 / (FLOOR_TILE * tex.PORCELAIN_TILES), 1 / (FLOOR_TILE * tex.PORCELAIN_TILES));

  return {
    white: MT({ color: 0xf1ece4, roughness: 0.45 }),
    wood: MT({ map: tx(tex.wood(rnd())) }),
    stone: MT({ map: tx(tex.marble(rnd())), roughness: 0.35 }),
    black: M(0x1c1a19),
    wall: MT({ map: tx(tex.noise(rnd(), 246, 242, 236, 6, 256)) }),
    line: M(0xc9c0b2),
    cushion: MT({ map: tx(tex.noise(rnd(), 231, 222, 208, 22), 3, 3) }),
    sofa: MT({ map: tx(tex.noise(rnd(), 227, 219, 207, 22), 4, 4) }),
    rug: MT({ map: tx(tex.rug(rnd())) }),
    linen: MT({ map: tx(tex.noise(rnd(), 250, 247, 242, 8), 3, 3) }),
    throw: MT({ map: tx(tex.noise(rnd(), 201, 185, 163, 26), 4, 4) }),
    tub: MT({ color: 0xfdfdfb, roughness: 0.3 }),
    door: M(0x3a3a3a),
    frost: M(0xdfe6ea),
    table: MT({ map: tx(tex.noise(rnd(), 216, 207, 194, 14)) }),
    steel: MT({ color: 0xbcb3a5, metalness: 0.5, roughness: 0.4 }),
    floor: MT({ map: floorMap, roughness: 0.35, side: THREE.DoubleSide }),
    tile: MT({ map: tx(tex.tile(rnd()), 1 / 0.6, 1 / 0.6), roughness: 0.5, side: THREE.DoubleSide }),
    glass: new THREE.MeshStandardMaterial({ color: 0xa9d4ef, transparent: true, opacity: 0.35 }),
    led: basic({ color: 0xffc070 }),
    screen: basic({ map: plain(tex.screen()) }),
    facade: MT({ map: tx(tex.noise(rnd(), 238, 233, 225, 10, 256)) }),
    handle: M(0xb08a55),
    shelf: M(0xf2e6d0),
    basin: M(0xcfd6da),
    mirror: MT({ color: 0xbfd0da, roughness: 0.1, metalness: 0.3 }),
    tubWater: M(0xcfe0e8),
    garageDoor: MT({ map: plain(tex.garageDoor(rnd())), roughness: 0.5, metalness: 0.3 }),
    ground: MT({ map: tx(tex.noise(rnd(), 200, 196, 188, 18, 256), 22, 22) }),
    compass: basic({ map: plain(tex.compass()), transparent: true }),
    ambilight: basic({ map: plain(tex.ambilight()), transparent: true, depthWrite: false }),
    // Techo invisible: no pinta ni escribe profundidad, pero proyecta sombra.
    ceiling: basic({ colorWrite: false, depthWrite: false }),
    sun: basic({ color: 0xffd27a }),
    // Parcela. Las UV de los suelos van en metros: un canvas de pavimento cubre PAVER m.
    grass: MT({ map: tx(tex.grass(rnd()), 1 / 2, 1 / 2), roughness: 0.95 }),
    terracePaving: MT({ map: tx(tex.pavers(rnd(), [214, 198, 174], '#b9a88f', 4), 1 / PAVER, 1 / PAVER) }),
    carsPaving: MT({ map: tx(tex.pavers(rnd(), [168, 166, 160], '#8f8d88', 8), 1 / PAVER, 1 / PAVER), roughness: 0.85 }),
    stripPaving: MT({ map: tx(tex.pavers(rnd(), [222, 216, 206], '#b8b0a3', 4), 1 / PAVER, 1 / PAVER) }),
    poolTile: MT({ map: tx(tex.noise(rnd(), 150, 200, 222, 10)), roughness: 0.4 }),
    graphite: MT({ color: 0x3a3c3f, metalness: 0.5, roughness: 0.5 }),
    water: new THREE.MeshStandardMaterial({ color: 0x3d8fbe, transparent: true, opacity: 0.72, roughness: 0.08 }),
    hatch: MT({ map: tx(tex.hatch(), hatchSize[0] / 0.2, hatchSize[1] / 0.2), transparent: true, depthWrite: false }),
  };
}

/** Libera materiales y sus texturas. */
export function disposeMaterials(materials: Materials) {
  for (const m of Object.values(materials)) {
    if ('map' in m && m.map instanceof THREE.Texture) m.map.dispose();
    m.dispose();
  }
}
