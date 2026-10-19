/**
 * Modo videojuego: relieve (mapas de normales generados de las propias
 * texturas), brillos y reflejos del entorno, y emisivos que resplandecen con
 * el bloom. Todo se genera la primera vez que se activa y se deshace al
 * desactivarlo, dejando los materiales como estaban.
 */
import * as THREE from 'three';
import type { Materials } from './materials';
import * as tex from './textures';

type Key = keyof Materials;

/** Relieve (normalScale) de los materiales con textura. Las paredes interiores van lisas. */
const RELIEF: Partial<Record<Key, number>> = {
  floor: 0.9, wood: 0.5, stone: 0.25, facade: 0.7, cushion: 0.6, sofa: 0.6, rug: 0.9, linen: 0.4,
  throw: 0.7, table: 0.4, bathOak: 0.7, slate: 1.3, stoneBowl: 0.8, oakMedium: 0.5, terracePaving: 1.1, carsPaving: 1.2, grass: 1.0, garageDoor: 1.4, poolTile: 0.5, ground: 1.0,
};
/** Superficies lisas: un micro relieve común para que no parezcan de plástico. */
const MICRO: Key[] = [
  'white', 'black', 'door', 'frost', 'steel', 'graphite', 'tub', 'line', 'handle', 'shelf', 'carBody', 'carRoof', 'mirror',
];
/** Brillo de las superficies. */
const SURFACE: Partial<Record<Key, { roughness: number }>> = {
  floor: { roughness: 0.3 }, stone: { roughness: 0.32 }, white: { roughness: 0.35 }, tub: { roughness: 0.15 },
  steel: { roughness: 0.25 }, mirror: { roughness: 0.03 }, glass: { roughness: 0.03 }, carBody: { roughness: 0.12 },
  carRoof: { roughness: 0.12 }, tinted: { roughness: 0.03 }, water: { roughness: 0.02 }, graphite: { roughness: 0.35 },
  harleyBlue: { roughness: 0.12 }, chrome: { roughness: 0.08 },
};
/**
 * Materiales que reflejan el cielo y cuánto. Solo estos: como entorno global
 * el cielo teñía de azul los interiores. Su radiancia es muy alta, de ahí los
 * valores pequeños.
 */
const REFLECT: Partial<Record<Key, number>> = {
  carBody: 0.2, carRoof: 0.2, harleyBlue: 0.2, chrome: 0.35, water: 0.25, glass: 0.2, tinted: 0.25, steel: 0.12, mirror: 0.1, tub: 0.05, graphite: 0.06, garageDoor: 0.05,
};
/** Pintura del coche y de la moto: capa de barniz brillante sobre el color. */
const CLEARCOAT: Key[] = ['carBody', 'carRoof', 'harleyBlue'];
/** Telas: brillo aterciopelado al mirarlas de canto. */
const SHEEN: Key[] = ['sofa', 'cushion', 'linen', 'throw'];

/** Emisivos (MeshBasic): se suben por encima de 1 para que el bloom los haga brillar. */
const GLOW: Partial<Record<Key, number>> = { led: 5, screen: 1.6, ambilight: 3, carLightFront: 2.5, carLightRear: 3.5 };

type Saved = {
  normalMap: THREE.Texture | null; normalScale: THREE.Vector2; roughness: number; envMap: THREE.Texture | null; envMapIntensity: number;
};

export interface Quality {
  normals: Map<THREE.MeshStandardMaterial, { map: THREE.Texture; scale: number }>;
  /** Texturas que se cambian en el modo (terreno exterior: campo seco). */
  maps: Map<THREE.MeshStandardMaterial, { on: THREE.Texture; off: THREE.Texture | null }>;
  /** Campo seco para el terreno que llega al horizonte. */
  field: { map: THREE.Texture; normal: THREE.Texture };
  saved: Map<THREE.Material, Saved>;
  colors: Map<THREE.MeshBasicMaterial, THREE.Color>;
  water: THREE.Texture;
}

const std = (m: THREE.Material | undefined): m is THREE.MeshStandardMaterial => m instanceof THREE.MeshStandardMaterial;

/** Genera los mapas de normales (la primera vez que se activa el modo). */
export function createQuality(materials: Materials, anisotropy: number): Quality {
  const normals: Quality['normals'] = new Map();
  const fromCanvas = (canvas: HTMLCanvasElement, strength: number, like?: THREE.Texture) => {
    const t = new THREE.CanvasTexture(tex.normalMap(canvas, strength));
    t.wrapS = like?.wrapS ?? THREE.RepeatWrapping; t.wrapT = like?.wrapT ?? THREE.RepeatWrapping;
    if (like) { t.repeat.copy(like.repeat); t.offset.copy(like.offset); }
    t.anisotropy = anisotropy;
    return t;
  };
  // Terreno exterior: campo seco (un canvas cubre 4 m) en lugar del plano beige
  const fieldCanvas = tex.field(tex.mulberry32(903));
  const fieldMap = new THREE.CanvasTexture(fieldCanvas);
  fieldMap.colorSpace = THREE.SRGBColorSpace;
  fieldMap.wrapS = fieldMap.wrapT = THREE.RepeatWrapping;
  fieldMap.anisotropy = anisotropy;
  const maps: Quality['maps'] = new Map();
  if (std(materials.ground) && materials.ground.map) {
    const on = fieldMap.clone();
    on.repeat.set(11, 11);
    maps.set(materials.ground, { on, off: materials.ground.map });
  }
  const fieldNormal = fromCanvas(fieldCanvas, 3);
  for (const [key, scale] of Object.entries(RELIEF) as [Key, number][]) {
    if (key === 'ground') continue;
    const m = materials[key];
    if (std(m) && m.map?.image instanceof HTMLCanvasElement) normals.set(m, { map: fromCanvas(m.map.image, 3, m.map), scale });
  }
  const micro = fromCanvas(tex.noise(tex.mulberry32(901), 128, 128, 128, 40, 256), 1.5);
  micro.repeat.set(2, 2);
  for (const key of MICRO) {
    const m = materials[key];
    if (std(m)) normals.set(m, { map: micro, scale: 0.15 });
  }
  const water = fromCanvas(tex.ripples(tex.mulberry32(902)), 6);
  water.repeat.set(1.5, 1.5);
  if (std(materials.water)) normals.set(materials.water, { map: water, scale: 0.35 });
  if (std(materials.ground)) {
    const n = fieldNormal.clone();
    n.repeat.set(11, 11);
    normals.set(materials.ground, { map: n, scale: 1 });
  }
  return { normals, maps, field: { map: fieldMap, normal: fieldNormal }, saved: new Map(), colors: new Map(), water };
}

/** Activa o desactiva el modo videojuego sobre los materiales compartidos. */
export function applyQuality(materials: Materials, q: Quality, on: boolean) {
  const touched = new Set<THREE.Material>([...q.normals.keys()]);
  for (const key of [...Object.keys(SURFACE), ...Object.keys(REFLECT)] as Key[]) touched.add(materials[key]);
  for (const m of touched) {
    if (!std(m)) continue;
    if (on) {
      if (!q.saved.has(m)) {
        q.saved.set(m, { normalMap: m.normalMap, normalScale: m.normalScale.clone(), roughness: m.roughness, envMap: m.envMap, envMapIntensity: m.envMapIntensity });
      }
      const n = q.normals.get(m);
      if (n) { m.normalMap = n.map; m.normalScale.set(n.scale, n.scale); }
      const key = (Object.keys(materials) as Key[]).find(k => materials[k] === m);
      const s = key ? SURFACE[key] : undefined;
      if (s) m.roughness = s.roughness;
      const swap = q.maps.get(m);
      if (swap) m.map = swap.on;
      if (key && REFLECT[key] !== undefined) m.envMapIntensity = REFLECT[key];
    } else {
      const s = q.saved.get(m);
      if (s) {
        m.normalMap = s.normalMap; m.normalScale.copy(s.normalScale); m.roughness = s.roughness;
        m.envMap = s.envMap; m.envMapIntensity = s.envMapIntensity;
      }
      const swap = q.maps.get(m);
      if (swap) m.map = swap.off;
    }
    m.needsUpdate = true;
  }
  for (const key of CLEARCOAT) {
    const m = materials[key];
    if (!(m instanceof THREE.MeshPhysicalMaterial)) continue;
    m.clearcoat = on ? 1 : 0;
    m.clearcoatRoughness = 0.04;
  }
  for (const key of SHEEN) {
    const m = materials[key];
    if (!(m instanceof THREE.MeshPhysicalMaterial)) continue;
    m.sheen = on ? 1 : 0;
    m.sheenRoughness = 0.75;
    m.sheenColor.setScalar(0.35);
  }
  for (const [key, k] of Object.entries(GLOW) as [Key, number][]) {
    const m = materials[key];
    if (!(m instanceof THREE.MeshBasicMaterial)) continue;
    if (!q.colors.has(m)) q.colors.set(m, m.color.clone());
    m.color.copy(q.colors.get(m)!);
    if (on) m.color.multiplyScalar(k);
  }
}

/** Pone (o quita) el reflejo del cielo en los materiales que lo llevan. */
export function setReflections(materials: Materials, env: THREE.Texture | null) {
  for (const key of Object.keys(REFLECT) as Key[]) {
    const m = materials[key];
    if (!std(m)) continue;
    const recompile = (m.envMap === null) !== (env === null);
    m.envMap = env;
    if (recompile) m.needsUpdate = true;
  }
}

export function disposeQuality(q: Quality) {
  const done = new Set<THREE.Texture>([q.field.map, q.field.normal]);
  for (const t of done) t.dispose();
  for (const { on } of q.maps.values()) on.dispose();
  for (const { map } of q.normals.values()) if (!done.has(map)) { map.dispose(); done.add(map); }
}
