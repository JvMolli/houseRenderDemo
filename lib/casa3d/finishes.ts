/**
 * Aplica el configurador a los materiales compartidos. La primera vez guarda
 * el estado original de cada material (mapa, color y rugosidad) y siempre
 * parte de él. Las texturas de las opciones se generan al elegirlas.
 */
import * as THREE from 'three';
import { FINISHES, finishOption, type FinishConfig, type FinishTexture } from './config';
import type { Materials } from './materials';
import * as tex from './textures';

/** Cada textura y su escala: el suelo lleva UV en metros (un canvas de tarima cubre 1,2 m); las cajas, 0..1 por cara. */
const TEXTURES: Record<FinishTexture, { make: (rnd: tex.Rng) => HTMLCanvasElement; repeat: number; seed: number }> = {
  oakFloor: { make: tex.oakPlanks, repeat: 1 / 1.2, seed: 701 },
  whiteMarble: { make: rnd => tex.marble(rnd, tex.WHITE_MARBLE), repeat: 1, seed: 702 },
  granite: { make: tex.granite, repeat: 1, seed: 703 },
  oak: { make: tex.wood, repeat: 1, seed: 704 },
};

export interface FinishState {
  defaults: Map<THREE.MeshStandardMaterial, { map: THREE.Texture | null; color: THREE.Color; roughness: number }>;
  textures: Map<FinishTexture, THREE.Texture>;
}

export const createFinishState = (): FinishState => ({ defaults: new Map(), textures: new Map() });

function texture(state: FinishState, id: FinishTexture, anisotropy: number) {
  let t = state.textures.get(id);
  if (!t) {
    const { make, repeat, seed } = TEXTURES[id];
    t = new THREE.CanvasTexture(make(tex.mulberry32(seed)));
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.setScalar(repeat);
    t.anisotropy = anisotropy;
    state.textures.set(id, t);
  }
  return t;
}

export function applyFinishes(materials: Materials, config: FinishConfig, state: FinishState, anisotropy: number) {
  for (const slot of FINISHES) {
    const o = finishOption(slot, config);
    // Tinte = color elegido / color original, en lineal: sobre la textura original da el color elegido.
    const target = new THREE.Color(o.color), base = new THREE.Color(slot.base);
    const tint = new THREE.Color(target.r / base.r, target.g / base.g, target.b / base.b);
    for (const key of slot.materials) {
      const m = materials[key];
      if (!(m instanceof THREE.MeshStandardMaterial)) continue;
      let d = state.defaults.get(m);
      if (!d) state.defaults.set(m, d = { map: m.map, color: m.color.clone(), roughness: m.roughness });
      const map = o.texture ? texture(state, o.texture, anisotropy) : o.solid ? null : d.map;
      if (!map !== !m.map) m.needsUpdate = true;
      m.map = map;
      // Marca para el modo videojuego: no taparla con su foto.
      m.userData.finishTexture = !!o.texture;
      if (o.texture) m.color.set(0xffffff);
      else if (o.solid) m.color.copy(target);
      else m.color.copy(d.color).multiply(tint);
      m.roughness = o.roughness ?? d.roughness;
    }
  }
}

export function disposeFinishes(state: FinishState) {
  for (const t of state.textures.values()) t.dispose();
}
