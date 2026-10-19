/**
 * Configurador de acabados: cada apartado cambia uno o varios materiales de
 * la maqueta. La primera opción de cada apartado es la casa tal cual está.
 * Datos puros (sin three): la interfaz los usa sin cargar la escena.
 */
import type { Materials } from './materials';

/** Texturas generadas que puede poner una opción en lugar de la del material. */
export type FinishTexture = 'oakFloor' | 'whiteMarble' | 'granite' | 'oak';

export interface FinishOption {
  id: string;
  label: string;
  /** Color que se ve (sRGB): muestra del botón y, sin `texture` ni `solid`, color al que se tiñe el material. */
  color: number;
  /** Textura propia en lugar de la del material; lleva su color. */
  texture?: FinishTexture;
  /** Color liso, sin textura. */
  solid?: boolean;
  /** Rugosidad propia (si no, la del material). */
  roughness?: number;
}

export interface FinishSlot {
  id: string;
  label: string;
  materials: readonly (keyof Materials)[];
  /** Color medio (sRGB) del acabado original: el tinte de cada opción se calcula respecto a él. */
  base: number;
  options: readonly FinishOption[];
}

export const FINISHES: readonly FinishSlot[] = [
  {
    id: 'suelo', label: 'Suelo', materials: ['floor'], base: 0xe6d5bd,
    options: [
      { id: 'beige', label: 'Porcelánico beige', color: 0xe6d5bd },
      { id: 'blanco', label: 'Porcelánico blanco', color: 0xf1efea },
      { id: 'gris', label: 'Porcelánico gris', color: 0xc9c7c2 },
      { id: 'grafito', label: 'Porcelánico grafito', color: 0x6f6d6a },
      { id: 'roble', label: 'Tarima de roble', color: 0xc29a6b, texture: 'oakFloor', roughness: 0.55 },
    ],
  },
  {
    id: 'paredes', label: 'Paredes', materials: ['wall'], base: 0xf6f2ec,
    options: [
      { id: 'blanco', label: 'Blanco roto', color: 0xf6f2ec },
      { id: 'perla', label: 'Gris perla', color: 0xdedcd8 },
      { id: 'arena', label: 'Arena', color: 0xe8dcc8 },
      { id: 'salvia', label: 'Verde salvia', color: 0xc5cdb8 },
      { id: 'niebla', label: 'Azul niebla', color: 0xc8d3dc },
    ],
  },
  {
    id: 'encimera', label: 'Encimera', materials: ['stone'], base: 0x2b2522,
    options: [
      { id: 'marmolNegro', label: 'Mármol negro', color: 0x2b2522 },
      { id: 'marmolBlanco', label: 'Mármol blanco', color: 0xebe7e1, texture: 'whiteMarble', roughness: 0.3 },
      { id: 'granito', label: 'Granito gris', color: 0x8a8986, texture: 'granite', roughness: 0.4 },
      { id: 'roble', label: 'Roble', color: 0xd6b283, texture: 'oak', roughness: 0.6 },
      { id: 'blanco', label: 'Compacto blanco', color: 0xf3f2ef, solid: true, roughness: 0.3 },
    ],
  },
  {
    id: 'cocina', label: 'Muebles de cocina', materials: ['cabinet'], base: 0xf1ece4,
    options: [
      { id: 'blanco', label: 'Blanco', color: 0xf1ece4 },
      { id: 'piedra', label: 'Gris piedra', color: 0xb9b4ac },
      { id: 'antracita', label: 'Antracita', color: 0x3c3d3f },
      { id: 'salvia', label: 'Verde salvia', color: 0x8f9c84 },
      { id: 'marino', label: 'Azul marino', color: 0x2d3a4f },
      { id: 'roble', label: 'Roble', color: 0xd6b283, texture: 'oak', roughness: 0.6 },
    ],
  },
  {
    id: 'madera', label: 'Madera (correderas y armarios)', materials: ['wood'], base: 0xd6b283,
    options: [
      { id: 'claro', label: 'Roble claro', color: 0xd6b283 },
      { id: 'natural', label: 'Roble natural', color: 0xb88a58 },
      { id: 'nogal', label: 'Nogal', color: 0x7a5236 },
      { id: 'ceniza', label: 'Gris ceniza', color: 0xb5aa9c },
    ],
  },
  {
    // Sofá, cojines de los sillones y asientos de los taburetes.
    id: 'tapiceria', label: 'Tapicería', materials: ['sofa', 'cushion'], base: 0xe3dbcf,
    options: [
      { id: 'beige', label: 'Beige', color: 0xe3dbcf },
      { id: 'gris', label: 'Gris', color: 0x9d9a96 },
      { id: 'antracita', label: 'Antracita', color: 0x4a4b4e },
      { id: 'azul', label: 'Azul', color: 0x3f5470 },
      { id: 'oliva', label: 'Verde oliva', color: 0x7b7d5a },
      { id: 'terracota', label: 'Terracota', color: 0xb8735a },
    ],
  },
  {
    id: 'fachada', label: 'Fachada', materials: ['facade'], base: 0xeee9e1,
    options: [
      { id: 'blanco', label: 'Blanco', color: 0xeee9e1 },
      { id: 'arena', label: 'Arena', color: 0xe6dccc },
      { id: 'gris', label: 'Gris claro', color: 0xcfcdc8 },
      { id: 'piedra', label: 'Piedra', color: 0xc9bca6 },
    ],
  },
];

/** Opción elegida en cada apartado (id del apartado -> id de la opción). */
export type FinishConfig = Readonly<Record<string, string>>;

export const DEFAULT_FINISHES: FinishConfig = Object.fromEntries(FINISHES.map(s => [s.id, s.options[0].id]));

export const finishOption = (slot: FinishSlot, config: FinishConfig): FinishOption =>
  slot.options.find(o => o.id === config[slot.id]) ?? slot.options[0];

/** Configuración guardada -> válida: lo que no exista ya se queda en la opción original. */
export function parseFinishes(saved: unknown): FinishConfig {
  const obj = typeof saved === 'object' && saved !== null ? saved as Record<string, unknown> : {};
  return Object.fromEntries(FINISHES.map(s => {
    const id = obj[s.id];
    return [s.id, s.options.some(o => o.id === id) ? id as string : s.options[0].id];
  }));
}

/** Color sRGB en CSS, para las muestras. */
export const cssColor = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;
