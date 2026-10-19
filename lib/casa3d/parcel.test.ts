import { describe, expect, it } from 'vitest';
import { BOUNDARY_RUNS, fromSketch, LEVELS, OUTDOOR_STAIR, SKETCH_HOUSE, toSketch } from './parcel';
import { outdoorStair, PLATFORMS, STEPS } from './parcelShapes';
import { FP_BOUNDS, GROUND_DOOR, GROUND_DOOR_BOXES } from './plan';
import { FH, X, Z } from './units';

describe('boceto de la parcela -> plano del piso', () => {
  it('el rectángulo «Casa» cae sobre la huella, girado 90° (arriba del boceto = SO)', () => {
    const [sx1, sy1, sx2, sy2] = SKETCH_HOUSE, [x1, z1, x2, z2] = FP_BOUNDS;
    expect(fromSketch([sx2, sy1])).toEqual([x1, z1]); // arriba derecha = esquina SO-NO
    expect(fromSketch([sx1, sy1])).toEqual([x1, z2]); // arriba izquierda = esquina SO-SE
    expect(fromSketch([sx2, sy2])).toEqual([x2, z1]);
    expect(fromSketch([sx1, sy2])).toEqual([x2, z2]);
  });

  it('toSketch deshace fromSketch', () => {
    for (const p of [[165, 20], [715, 260], [1105, 335]] as const) {
      const [sx, sy] = toSketch(fromSketch(p));
      expect(sx).toBeCloseTo(p[0], 9);
      expect(sy).toBeCloseTo(p[1], 9);
    }
  });
});

describe('cerramiento', () => {
  const segments = BOUNDARY_RUNS.flatMap(r => r.points.slice(1).map((b, i) => [r.points[i], b] as const));
  const has = (a: readonly number[], b: readonly number[]) =>
    segments.some(([p, q]) => (p[0] === a[0] && p[1] === a[1] && q[0] === b[0] && q[1] === b[1]) || (p[0] === b[0] && p[1] === b[1] && q[0] === a[0] && q[1] === a[1]));

  it('sin muro en la fachada NO de la casa ni en el frente de los coches (entrada)', () => {
    expect(has([1350, 455], [1350, 765])).toBe(false);
    expect(has([815, 20], [1105, 20])).toBe(false);
  });

  it('muro 1 m sobre el suelo interior: el jardín por debajo de coches y terraza', () => {
    expect(LEVELS.raised - LEVELS.garden).toBe(1);
    expect(BOUNDARY_RUNS.map(r => r.level)).toEqual([LEVELS.garden, LEVELS.raised, LEVELS.raised, LEVELS.garden]);
  });
});

describe('suelos y escalones', () => {
  it('plataformas a cota 0 y peldaños de 25 cm entre el jardín y la cota 0', () => {
    expect(PLATFORMS.every(p => p.top === LEVELS.raised)).toBe(true);
    expect(STEPS.map(s => s.top)).toEqual([-0.75, -0.5, -0.25, -0.75, -0.5, -0.25]);
  });
});

describe('escalera exterior', () => {
  const st = outdoorStair();
  const lo = (b: { position: number[]; size: number[] }) => b.position[0] - b.size[0] / 2;
  const hi = (b: { position: number[]; size: number[] }) => b.position[0] + b.size[0] / 2;

  it('arranca en la franja y sube hacia la puerta de entrada', () => {
    expect(lo(st.steps[0])).toBeCloseTo(X(FP_BOUNDS[0]), 9);
    expect(st.steps[0].size[1]).toBeCloseTo(st.rise, 9);
    expect(hi(st.steps.at(-1)!)).toBeCloseTo(lo(st.landing), 9);
  });

  it('rellano a la altura del piso, delante de la puerta', () => {
    const [d1, d2] = OUTDOOR_STAIR.entranceDoor;
    expect(st.landing.size[1]).toBe(FH);
    expect(lo(st.landing)).toBeLessThan(X(d1));
    expect(hi(st.landing)).toBeGreaterThan(X(d2));
  });

  it('tabica dentro del máximo', () => {
    expect(st.rise).toBeLessThanOrEqual(OUTDOOR_STAIR.maxRiser);
    expect(st.rise * (st.steps.length + 1)).toBeCloseTo(FH, 9);
  });
});

describe('puerta de la planta baja', () => {
  it('centrada bajo la ventana de la barra/cocina de la fachada SO', () => {
    expect(GROUND_DOOR.center).toBeCloseTo((Z(737) + Z(897)) / 2, 9);
    const [door] = GROUND_DOOR_BOXES;
    expect(door[5] + door[2] / 2).toBeCloseTo(GROUND_DOOR.center, 9);
    expect(door[2]).toBe(GROUND_DOOR.width);
  });
});
