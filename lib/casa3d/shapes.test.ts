import { describe, expect, it } from 'vitest';
import type { Box } from './plan';
import { chamferWall, closet, cyl, pbox, wallBoxes } from './shapes';
import { HT, S } from './units';

describe('pbox / cyl', () => {
  it('B(): un rectángulo de 119 px es 1 m, posición por la esquina mínima', () => {
    expect(pbox([78, 68, 78 + S, 68 + S, 0, 1, 'white'])).toEqual({
      kind: 'box', size: [1, 1, 1], position: [0.5, 0.5, 0.5], mat: 'white',
    });
  });

  it('cyl(): centro en el plano y altura desde y0', () => {
    expect(cyl([78 + S, 68, 0.2, 1, 0.5, 'black']).position).toEqual([1, 1.25, 0]);
  });
});

describe('wallBoxes', () => {
  it('muro sin huecos: una sola caja de altura HT', () => {
    expect(wallBoxes(['h', 52, 68, 45, 1005])).toEqual([[45, 52, 1005, 68, 0, HT, 'wall']]);
  });

  it('ventana: muro a los lados, antepecho, dintel, vidrio centrado y carpintería', () => {
    const boxes = wallBoxes(['v', 45, 78, 68, 1232, [{ a: 268, b: 552, s: 0.8, h: 2.3, w: true }]]);
    const byMat = (m: string) => boxes.filter(b => b[6] === m);
    expect(byMat('wall')).toEqual<Box[]>([
      [45, 68, 78, 268, 0, HT, 'wall'],
      [45, 268, 78, 552, 0, 0.8, 'wall'],
      [45, 268, 78, 552, 2.3, HT, 'wall'],
      [45, 552, 78, 1232, 0, HT, 'wall'],
    ]);
    expect(byMat('glass')).toEqual([[60.5, 268, 62.5, 552, 0.8, 2.3, 'glass']]);
    expect(byMat('black')).toHaveLength(5);
  });

  it('hueco hasta el suelo: no genera antepecho de altura cero', () => {
    const boxes = wallBoxes(['v', 640, 650, 68, 932, [{ a: 345, b: 440, s: 0, h: HT }]]);
    expect(boxes).toEqual([[640, 68, 650, 345, 0, HT, 'wall'], [640, 440, 650, 932, 0, HT, 'wall']]);
  });

  it('puerta opaca con vidrio esmerilado', () => {
    const mats = wallBoxes(['h', 1232, 1265, 45, 650, [{ a: 405, b: 500, s: 0, h: 2.1, d: true }]]).map(b => b[6]);
    expect(mats).toContain('door');
    expect(mats).toContain('frost');
  });
});

describe('muebles', () => {
  it('armario: módulos alternos blanco/roble con 1 px de junta', () => {
    expect(closet([650, 452, 970, 520, 4]).map(b => [b[0], b[2], b[6]])).toEqual([
      [650, 729, 'white'], [730, 809, 'wood'], [810, 889, 'white'], [890, 969, 'wood'],
    ]);
  });

  it('muro en chaflán: longitud y giro entre sus dos extremos', () => {
    const w = chamferWall([78, 68], [78 + 3 * S, 68 + 4 * S], 0.32);
    expect(w.size[0]).toBeCloseTo(5);
    expect(w.rotationY).toBeCloseTo(Math.atan2(-4, 3));
    expect(w.position).toEqual([1.5, HT / 2, 2]);
  });
});
