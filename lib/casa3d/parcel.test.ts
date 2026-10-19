import { describe, expect, it } from 'vitest';
import {
  BOUNDARY_RUNS, CAR, DIAGONAL, fromSketch, GATE, LEVELS, OUTDOOR_STAIR, OUTLINE, PUMP, SKETCH_HOUSE, STAIR_FLIGHTS, TERRACE, TERRACE_SET,
  toSketch,
} from './parcel';
import { insidePolygon, OUTLINE_PLAN, outdoorStair, PLATFORMS, sketchRect, STEPS } from './parcelShapes';
import { FP, FP_BOUNDS, GROUND_DOOR, GROUND_DOOR_BOXES } from './plan';
import { FH, OX, OZ, S, X } from './units';

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

describe('contorno', () => {
  const near = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9;

  it('el lindero en diagonal va de la esquina de la depuradora a la esquina del baño', () => {
    expect(fromSketch(DIAGONAL.to)[0]).toBeCloseTo(FP[3][0], 9);
    expect(fromSketch(DIAGONAL.to)[1]).toBeCloseTo(FP[3][1], 9);
    expect(OUTLINE[0]).toEqual(DIAGONAL.from);
    expect(OUTLINE.at(-1)).toBe(DIAGONAL.to);
  });

  it('terraza de unos 12 m², depuradora y coche dentro de la parcela', () => {
    const pts = TERRACE.map(p => fromSketch(p)).map(([x, z]) => [X(x), (z - OZ) / S]);
    const area = Math.abs(pts.reduce((a, [x1, z1], i) => { const [x2, z2] = pts[(i + 1) % pts.length]; return a + x1 * z2 - x2 * z1; }, 0)) / 2;
    expect(area).toBeCloseTo(12, 0);
    const inside = (p: readonly [number, number]) => insidePolygon(fromSketch(p), OUTLINE_PLAN);
    expect(inside(TERRACE_SET.table)).toBe(true);
    const [x1, z1, x2, z2] = sketchRect(PUMP.rect);
    for (const c of [[x1, z1], [x2, z1], [x2, z2], [x1, z2]] as const) expect(insidePolygon(c, OUTLINE_PLAN)).toBe(true);
    expect(inside(CAR.center)).toBe(true);
  });

  it('sin muro en las fachadas ni el chaflán; portón en el frente de los coches', () => {
    const segs = BOUNDARY_RUNS.flatMap(r => r.points.slice(1).map((b, i) => [r.points[i], b] as const));
    const has = (a: readonly number[], b: readonly number[]) => segs.some(([p, q]) => (near(p, a) && near(q, b)) || (near(p, b) && near(q, a)));
    expect(has([1350, 455], [1350, 765])).toBe(false);
    expect(has(OUTLINE[5], OUTLINE[6])).toBe(false);
    expect(has(GATE.from, GATE.to)).toBe(false);
    expect(GATE.from).toEqual([815, 20]);
    expect(GATE.to).toEqual([1105, 20]);
  });
});

describe('cotas', () => {
  it('terraza y coches 1 m sobre el resto del patio; la planta baja a cota del jardín', () => {
    expect(LEVELS.garden).toBe(0);
    expect(LEVELS.raised - LEVELS.garden).toBe(1);
    expect(LEVELS.outside).toBe(LEVELS.raised);
    expect(PLATFORMS.every(p => p.top === LEVELS.raised)).toBe(true);
    expect(STEPS.map(s => s.top)).toEqual([0.25, 0.5, 0.75]);
  });
});

describe('escalera exterior', () => {
  const st = outdoorStair();
  const lo = (b: { position: number[]; size: number[] }) => b.position[0] - b.size[0] / 2;
  const hi = (b: { position: number[]; size: number[] }) => b.position[0] + b.size[0] / 2;
  const landingX = st.landing.points.map(p => (p[0] - OX) / S);

  it('sube del jardín a la terraza, que hace de descanso, y de ahí a la puerta', () => {
    const { lowerTreads, upperTreads } = STAIR_FLIGHTS;
    expect(st.steps).toHaveLength(lowerTreads + upperTreads);
    expect(hi(st.steps[lowerTreads - 1])).toBeCloseTo(X(FP_BOUNDS[0]), 9);
    expect(st.steps[lowerTreads - 1].size[1] + st.rise).toBeCloseTo(LEVELS.raised, 9);
    expect(st.steps[lowerTreads].size[1] - st.rise).toBeCloseTo(LEVELS.raised, 9);
    // El descanso está dentro de la terraza, de lado a lado de la escalera
    const restX = (hi(st.steps[lowerTreads - 1]) + lo(st.steps[lowerTreads])) / 2;
    const terrace = TERRACE.map(p => fromSketch(p));
    for (const z of [st.steps[0].position[2] - st.steps[0].size[2] / 2 + 0.05, st.steps[0].position[2] + st.steps[0].size[2] / 2 - 0.05]) {
      expect(insidePolygon([OX + restX * S, OZ + z * S], terrace)).toBe(true);
    }
    expect(hi(st.steps.at(-1)!)).toBeCloseTo(Math.min(...landingX), 9);
  });

  it('rellano a la altura del piso, delante de la puerta', () => {
    const [d1, d2] = OUTDOOR_STAIR.entranceDoor;
    expect(st.landing.top).toBe(FH);
    expect(Math.min(...landingX)).toBeLessThan(X(d1));
    expect(Math.max(...landingX)).toBeGreaterThan(X(d2));
  });

  it('peldaños y rellano no atraviesan el muro del lindero', () => {
    const inside = (x: number, z: number) => insidePolygon([OX + x * S, OZ + z * S], OUTLINE_PLAN);
    for (const s of st.steps) expect(inside(hi(s), s.position[2] + s.size[2] / 2)).toBe(true);
    for (const p of st.landing.points) expect(insidePolygon([p[0] - 0.01, p[1] - 0.01], OUTLINE_PLAN)).toBe(true);
  });

  it('tabica dentro del máximo', () => {
    expect(st.rise).toBeLessThanOrEqual(OUTDOOR_STAIR.maxRiser);
    // Dos llegadas sin peldaño: la terraza y el rellano de la puerta
    expect(st.rise * (st.steps.length + 2)).toBeCloseTo(FH, 9);
  });
});

describe('puerta de la planta baja', () => {
  it('centrada bajo la ventana de la barra/cocina de la fachada SO, 2,8 m de ancho', () => {
    const [door] = GROUND_DOOR_BOXES;
    expect(door[5] + door[2] / 2).toBeCloseTo(GROUND_DOOR.center, 9);
    expect(door[2]).toBe(2.8);
  });
});
