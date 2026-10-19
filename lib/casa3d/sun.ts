/**
 * Sol real para Madrid (lat 40,4°), sin three.
 * La hora es hora de reloj: mediodía solar a las 13:15 en invierno (horario de
 * invierno) y a las 14:15 con horario de verano.
 * PLANUP: azimut de la dirección "arriba" del plano (-Z) = 315° (NO), así que
 * las ventanas del salón dan al SO.
 */
import type { Vec3 } from './units';

export type Season = 'invierno' | 'equinoccio' | 'verano';

export const LAT = 40.4;
export const PLANUP = 315;

/** Declinación (°) y mediodía solar en hora de reloj, por estación. */
export const SEASONS: Record<Season, { label: string; decl: number; noon: number }> = {
  invierno: { label: 'Invierno', decl: -23.44, noon: 13.25 },
  equinoccio: { label: 'Equinoccio', decl: 0, noon: 14.25 },
  verano: { label: 'Verano', decl: 23.44, noon: 14.25 },
};

/** Colores (hex sRGB) del sol bajo/alto y del fondo de noche/día. */
export const SUN_LOW = 0xffa860;
export const SUN_HIGH = 0xfff4e0;
export const SKY_NIGHT = 0x232836;
export const SKY_DAY = 0xf4efe8;

const RAD = Math.PI / 180;
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export interface SunPosition {
  /** Azimut en grados, 0 = N, 90 = E. */
  azimuth: number;
  /** Altura sobre el horizonte en grados. */
  altitude: number;
}

/** Posición del sol a una hora de reloj (decimal: 17.5 = 17:30) y estación. */
export function sunPosition(hour: number, season: Season): SunPosition {
  const s = SEASONS[season], lat = LAT * RAD;
  const Hr = 15 * (hour - s.noon) * RAD, d = s.decl * RAD;
  const sa = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(Hr);
  const A = Math.atan2(Math.sin(Hr), Math.cos(Hr) * Math.sin(lat) - Math.tan(d) * Math.cos(lat));
  return { azimuth: ((A / RAD + 180) % 360 + 360) % 360, altitude: Math.asin(sa) / RAD };
}

export interface SunState extends SunPosition {
  /** Sol sobre el horizonte. */
  up: boolean;
  /** Dirección hacia el sol en coordenadas de la escena (vector unitario). */
  dir: Vec3;
  /** 0..1 según la altura: intensidad y color del sol. */
  k: number;
  /** 0..1 desde el crepúsculo: luz ambiente y color del fondo. */
  kd: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function sunState(hour: number, season: Season): SunState {
  const p = sunPosition(hour, season);
  const alt = p.altitude * RAD, al = (p.azimuth - PLANUP) * RAD;
  return {
    ...p,
    up: alt > 0,
    dir: [Math.cos(alt) * Math.sin(al), Math.sin(alt), -Math.cos(alt) * Math.cos(al)],
    k: clamp01(Math.sin(alt) / 0.35),
    kd: clamp01((p.altitude + 6) / 20),
  };
}

/** Intensidades del original (r128, luces "legacy"): sol y hemisférica. */
export function legacyIntensities(s: SunState): { sun: number; hemi: number } {
  return { sun: s.up ? 0.25 + 0.75 * s.k : 0, hemi: 0.22 + 0.45 * s.kd };
}

/**
 * Intensidades para las luces físicas de three actual. Desde r155 hace falta
 * ×π para la misma irradiancia, pero además r128 sumaba la luz en espacio
 * gamma y ahora se ilumina en lineal y se codifica a sRGB al final: con solo
 * ×π las sombras salen más claras y el sol más apagado. Los exponentes están
 * ajustados comparando capturas con el original: hemisférica H^2,1 y sol
 * 2,05·S^1,65 (más π por las unidades físicas).
 */
export function lightIntensities(s: SunState): { sun: number; hemi: number } {
  const l = legacyIntensities(s);
  return { sun: Math.PI * 2.05 * l.sun ** 1.65, hemi: Math.PI * l.hemi ** 2.1 };
}

/** Interpola dos colores hex en sRGB (como hacía r128). Devuelve r, g, b en 0..1. */
export function lerpHex(a: number, b: number, t: number): [number, number, number] {
  const ch = (h: number, s: number) => ((h >> s) & 255) / 255;
  return [16, 8, 0].map(s => ch(a, s) + (ch(b, s) - ch(a, s)) * t) as [number, number, number];
}

/** 17.5 -> "17:30". */
export function formatHour(hour: number): string {
  const hh = Math.floor(hour), mm = Math.round((hour - hh) * 60);
  return hh + ':' + String(mm).padStart(2, '0');
}

export function describeSun(s: SunState): string {
  return s.up
    ? 'Sol al ' + DIRS[Math.round(s.azimuth / 45) % 8] + ' (' + Math.round(s.azimuth) + '°), a ' + Math.round(s.altitude) + '° de altura'
    : 'Sol bajo el horizonte';
}
