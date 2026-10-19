import { ShapeGeometry } from 'three';
import { memo, useEffect, useMemo } from 'react';
import { planShape, rectPoints, setPlanarUV } from '@/lib/casa3d/geometry';
import { COMPASS, FP, GROUND, GROUND_RECT, GROUND_SO_WALL, GROUND_WINDOW, type Pt } from '@/lib/casa3d/plan';
import { LEVELS } from '@/lib/casa3d/parcel';
import { OUTLINE_PLAN } from '@/lib/casa3d/parcelShapes';
import { GROUND_FLOOR_SOLIDS } from '@/lib/casa3d/solids';
import { FH } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';
import { Solids } from './Solids';

const [so1, so2] = GROUND_SO_WALL, gw = GROUND_WINDOW;
/** Huella con el hueco de la ventana en la fachada SO (FP acaba en [45, 1265] y cierra en [45, 52]). */
const NOTCHED_FP: Pt[] = [...FP, [so1, gw.b], [so2, gw.b], [so2, gw.a], [so1, gw.a]];
/** Bloque macizo de la planta baja en tres tramos; el central lleva el hueco de la ventana. */
const LAYERS = [
  { y: 0, extrude: { depth: gw.s, bevelEnabled: false }, notched: false },
  { y: gw.s, extrude: { depth: gw.h - gw.s, bevelEnabled: false }, notched: true },
  { y: gw.h, extrude: { depth: FH - 0.01 - gw.h, bevelEnabled: false }, notched: false },
];

const half = GROUND.size / 2;

/** Terreno exterior a la cota de la calle (con el hueco de la parcela), planta baja (apartamento) con su puerta y ventana, y brújula. */
export const Building = memo(function Building() {
  const m = useMaterials();
  const footprint = useMemo(() => planShape(FP), []);
  const notched = useMemo(() => planShape(NOTCHED_FP), []);
  // Mismo mapeado que el plano de 44 x 44 m del original (repeat 22 en el material).
  const ground = useMemo(() => setPlanarUV(
    new ShapeGeometry(planShape(rectPoints(GROUND_RECT), [OUTLINE_PLAN])),
    GROUND.position[0] - half, -GROUND.position[2] - half, GROUND.size,
  ), []);
  useEffect(() => () => ground.dispose(), [ground]);

  return (
    <>
      <mesh geometry={ground} material={m.ground} rotation-x={-Math.PI / 2} position-y={LEVELS.outside + GROUND.position[1]} receiveShadow />
      {LAYERS.map(l => (
        <mesh key={l.y} material={m.facade} rotation-x={-Math.PI / 2} position-y={l.y} castShadow receiveShadow>
          <extrudeGeometry args={[l.notched ? notched : footprint, l.extrude]} />
        </mesh>
      ))}
      <Solids items={GROUND_FLOOR_SOLIDS} />
      <group position={COMPASS.position} rotation-y={COMPASS.rotationY}>
        <mesh material={m.compass} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[COMPASS.size, COMPASS.size]} />
        </mesh>
      </group>
    </>
  );
});
