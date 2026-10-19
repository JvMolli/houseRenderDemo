import { describe, expect, it } from 'vitest';
import { describeSun, formatHour, legacyIntensities, sunPosition, sunState, type Season } from './sun';

/** Comprueba |a - b| <= tol. */
const near = (a: number, b: number, tol = 0.2) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);

describe('sunPosition', () => {
  const cases: [Season, number, string, number, number][] = [
    ['equinoccio', 14.25, '14:15', 180.0, 49.6],
    ['equinoccio', 17.5, '17:30', 240.4, 30.1],
    ['verano', 21, '21:00', 295.0, 7.0],
    ['invierno', 13.25, '13:15', 180.0, 26.2],
  ];

  it.each(cases)('%s a las %s (%s) -> azimut %d°, altura %d°', (season, hour, _label, azimuth, altitude) => {
    const p = sunPosition(hour, season);
    near(p.azimuth, azimuth);
    near(p.altitude, altitude);
  });

  it('mediodía solar a las 13:15 en invierno y a las 14:15 en equinoccio y verano', () => {
    for (const [season, noon] of [['invierno', 13.25], ['equinoccio', 14.25], ['verano', 14.25]] as const) {
      near(sunPosition(noon, season).azimuth, 180, 1e-9);
      expect(sunPosition(noon - 0.25, season).altitude).toBeLessThan(sunPosition(noon, season).altitude);
      expect(sunPosition(noon + 0.25, season).altitude).toBeLessThan(sunPosition(noon, season).altitude);
    }
  });

  it('azimut siempre en [0, 360)', () => {
    for (const season of ['invierno', 'equinoccio', 'verano'] as const)
      for (let h = 6; h <= 22.5; h += 0.25) {
        const { azimuth } = sunPosition(h, season);
        expect(azimuth).toBeGreaterThanOrEqual(0);
        expect(azimuth).toBeLessThan(360);
      }
  });
});

describe('sunState', () => {
  it('dirección unitaria; con PLANUP = 315 el sol del SO (225°) llega por -X (fachada SO)', () => {
    const s = sunState(17.5, 'equinoccio');
    near(Math.hypot(...s.dir), 1, 1e-9);
    const sw = sunState(16.5, 'equinoccio');
    expect(sw.dir[0]).toBeLessThan(0);
  });

  it('de noche no hay sol y la luz ambiente baja al mínimo', () => {
    const s = sunState(22.5, 'equinoccio');
    expect(s.up).toBe(false);
    expect(legacyIntensities(s)).toEqual({ sun: 0, hemi: 0.22 });
    expect(describeSun(s)).toBe('Sol bajo el horizonte');
  });

  it('a pleno día intensidades del original al máximo', () => {
    const s = sunState(14.25, 'verano');
    const l = legacyIntensities(s);
    expect(l.sun).toBe(1);
    expect(l.hemi).toBeCloseTo(0.67, 12);
  });
});

describe('textos', () => {
  it('formatHour', () => {
    expect(formatHour(17.5)).toBe('17:30');
    expect(formatHour(6)).toBe('6:00');
    expect(formatHour(22.25)).toBe('22:15');
    expect(formatHour(13.75)).toBe('13:45');
  });

  it('describeSun como en el original', () => {
    expect(describeSun(sunState(17.5, 'equinoccio'))).toBe('Sol al SO (240°), a 30° de altura');
  });
});
