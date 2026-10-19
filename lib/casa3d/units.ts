/**
 * Unidades del plano.
 * Todo se define en píxeles del plano original: 119 px = 1 m.
 * Origen (78,68) = esquina interior superior izquierda del salón.
 * Eje X del plano -> X de three.js, eje Y del plano -> Z de three.js.
 */

/** Coordenada del plano en píxeles. */
export type Px = number;
export type Vec3 = [number, number, number];

export const S = 119;
export const OX = 78;
export const OZ = 68;
/** Altura libre del piso (m). */
export const HT = 2.6;
/** Altura del forjado (m) sobre la planta baja. */
export const FH = 3.0;

/** px del plano -> metros en X. */
export const X = (p: Px) => (p - OX) / S;
/** px del plano -> metros en Z. */
export const Z = (p: Px) => (p - OZ) / S;

/** Centro aproximado del piso (m), objetivo del sol. */
export const C: Vec3 = [3.8, FH, 5];
