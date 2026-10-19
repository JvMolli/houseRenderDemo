/**
 * Texturas fotografiadas (PBR) del modo videojuego: color, relieve y
 * oclusión/rugosidad escaneados, en public/texturas (ver scripts/texturas.mjs).
 * Se cargan la primera vez que se activa el modo y van por el canal de UV 1,
 * que está en metros (addMetricUV1): `size` es el lado real de cada imagen.
 */
import * as THREE from 'three';
import type { Materials } from './materials';

type Key = keyof Materials;

interface PbrSpec {
  /** Carpeta dentro de /texturas. */
  dir: string;
  /** Lado (m) que cubre la imagen. */
  size: number;
  /**
   * `albedo`: el color de la foto sustituye al mapa del material (su color
   * queda de tinte). `tint`: la foto es gris (media lineal 0,5) y se tiñe con
   * `tint` (sRGB), el color que tenía el material. `detail`: el material
   * conserva su color y solo toma relieve, rugosidad y oclusión.
   */
  color: 'albedo' | 'tint' | 'detail';
  tint?: number;
  /** Intensidad del relieve (normalScale). */
  normal?: number;
  /** Multiplica la rugosidad del mapa. */
  roughness?: number;
}

export const PBR: Partial<Record<Key, PbrSpec>> = {
  wood: { dir: 'roble', size: 1.83, color: 'albedo', roughness: 0.8 },
  oakMedium: { dir: 'roble', size: 1.83, color: 'albedo', roughness: 0.8 },
  bathOak: { dir: 'tarima', size: 1.7, color: 'albedo' },
  grass: { dir: 'cesped', size: 1.5, color: 'albedo' },
  // Campo seco con el tono del campo generado; a 6 m se nota menos la repetición.
  ground: { dir: 'campo', size: 6, color: 'tint', tint: 0x9e967e, normal: 0.7 },
  asphalt: { dir: 'asfalto', size: 3, color: 'tint', tint: 0x6a6a67 },
  terracePaving: { dir: 'terraza', size: 2, color: 'tint', tint: 0xd6c6ae },
  carsPaving: { dir: 'adoquin', size: 2, color: 'tint', tint: 0xa8a6a0 },
  poolTile: { dir: 'gresite', size: 2, color: 'tint', tint: 0x96c8de },
  facade: { dir: 'estuco', size: 2, color: 'tint', tint: 0xeee9e1 },
  sofa: { dir: 'espiga', size: 0.27, color: 'tint', tint: 0xe3dbcf },
  cushion: { dir: 'punto', size: 0.26, color: 'tint', tint: 0xe7ded0 },
  linen: { dir: 'lino', size: 0.27, color: 'tint', tint: 0xfaf7f2 },
  throw: { dir: 'manta', size: 0.27, color: 'tint', tint: 0xc9b9a3 },
  rug: { dir: 'alfombra', size: 1.7, color: 'detail' },
  steel: { dir: 'acero', size: 1, color: 'detail' },
};

interface Maps { color: THREE.Texture | null; normal: THREE.Texture; arm: THREE.Texture }
type Saved = Pick<THREE.MeshStandardMaterial, 'map' | 'normalMap' | 'roughness' | 'roughnessMap' | 'aoMap' | 'aoMapIntensity'>
  & { color: THREE.Color; normalScale: THREE.Vector2 };

export interface PbrSet {
  maps: Map<THREE.MeshStandardMaterial, { maps: Maps; spec: PbrSpec }>;
  saved: Map<THREE.MeshStandardMaterial, Saved>;
  textures: THREE.Texture[];
}

/** Materiales que llevan textura fotografiada (para darles UV 1 a sus geometrías). */
export const pbrMaterials = (materials: Materials) =>
  new Set((Object.keys(PBR) as Key[]).map(k => materials[k]));

/** Descarga las texturas y prepara una copia por material con su escala. */
export async function loadPbr(materials: Materials, anisotropy: number): Promise<PbrSet> {
  const loader = new THREE.TextureLoader();
  const dirs = new Map<string, Promise<THREE.Texture[]>>();
  const load = (dir: string) => {
    if (!dirs.has(dir)) dirs.set(dir, Promise.all(['color', 'normal', 'arm'].map(f => loader.loadAsync(`/texturas/${dir}/${f}.webp`))));
    return dirs.get(dir)!;
  };
  const set: PbrSet = { maps: new Map(), saved: new Map(), textures: [] };
  await Promise.all((Object.entries(PBR) as [Key, PbrSpec][]).map(async ([key, spec]) => {
    const m = materials[key];
    if (!(m instanceof THREE.MeshStandardMaterial)) return;
    const [color, normal, arm] = (await load(spec.dir)).map(t => {
      const c = t.clone();
      c.channel = 1;
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.setScalar(1 / spec.size);
      c.anisotropy = anisotropy;
      set.textures.push(c);
      return c;
    });
    color.colorSpace = THREE.SRGBColorSpace;
    set.maps.set(m, { maps: { color: spec.color === 'detail' ? null : color, normal, arm }, spec });
  }));
  for (const p of dirs.values()) for (const t of await p) set.textures.push(t);
  return set;
}

/** Pone (o quita) las texturas fotografiadas en los materiales compartidos. */
export function applyPbr(set: PbrSet, on: boolean) {
  for (const [m, { maps, spec }] of set.maps) {
    if (on) {
      if (!set.saved.has(m)) {
        set.saved.set(m, {
          map: m.map, color: m.color.clone(), normalMap: m.normalMap, normalScale: m.normalScale.clone(),
          roughness: m.roughness, roughnessMap: m.roughnessMap, aoMap: m.aoMap, aoMapIntensity: m.aoMapIntensity,
        });
      }
      if (maps.color) m.map = maps.color;
      // Gris de media 0,5: el doble del tinte devuelve el color original de media.
      if (spec.color === 'tint' && spec.tint !== undefined) m.color.setHex(spec.tint).multiplyScalar(2);
      m.normalMap = maps.normal;
      m.normalScale.setScalar(spec.normal ?? 1);
      m.roughnessMap = maps.arm;
      m.roughness = spec.roughness ?? 1;
      m.aoMap = maps.arm;
      m.aoMapIntensity = 1;
    } else {
      const s = set.saved.get(m);
      if (!s) continue;
      Object.assign(m, { map: s.map, normalMap: s.normalMap, roughness: s.roughness, roughnessMap: s.roughnessMap, aoMap: s.aoMap, aoMapIntensity: s.aoMapIntensity });
      m.color.copy(s.color);
      m.normalScale.copy(s.normalScale);
    }
    m.needsUpdate = true;
  }
}

export function disposePbr(set: PbrSet) {
  for (const t of set.textures) t.dispose();
}
