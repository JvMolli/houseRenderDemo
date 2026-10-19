import { ShapeGeometry } from 'three';
import { memo, useEffect, useMemo } from 'react';
import { planShape, rectPoints, setPlanarUV } from '@/lib/casa3d/geometry';
import { COMPASS, FP, GROUND } from '@/lib/casa3d/plan';
import { LEVELS } from '@/lib/casa3d/parcel';
import { OUTLINE_PLAN } from '@/lib/casa3d/parcelShapes';
import { GROUND_DOOR_SOLIDS } from '@/lib/casa3d/solids';
import { FH, OX, OZ, S } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';
import { Solids } from './Solids';

const EXTRUDE = { depth: FH - 0.01, bevelEnabled: false };

/** Esquinas del terreno (px del plano) a partir de su centro y lado en metros. */
const half = GROUND.size / 2;
const GROUND_RECT = [
  OX + (GROUND.position[0] - half) * S, OZ + (GROUND.position[2] - half) * S,
  OX + (GROUND.position[0] + half) * S, OZ + (GROUND.position[2] + half) * S,
] as const;

/** Terreno exterior a la cota de la calle (con el hueco de la parcela), planta baja (apartamento) con su puerta y brújula. */
export const Building = memo(function Building() {
  const m = useMaterials();
  const footprint = useMemo(() => planShape(FP), []);
  // Mismo mapeado que el plano de 44 x 44 m del original (repeat 22 en el material).
  const ground = useMemo(() => setPlanarUV(
    new ShapeGeometry(planShape(rectPoints(GROUND_RECT), [OUTLINE_PLAN])),
    GROUND.position[0] - half, -GROUND.position[2] - half, GROUND.size,
  ), []);
  useEffect(() => () => ground.dispose(), [ground]);

  return (
    <>
      <mesh geometry={ground} material={m.ground} rotation-x={-Math.PI / 2} position-y={LEVELS.outside + GROUND.position[1]} receiveShadow />
      <mesh material={m.facade} rotation-x={-Math.PI / 2} castShadow receiveShadow>
        <extrudeGeometry args={[footprint, EXTRUDE]} />
      </mesh>
      <Solids items={GROUND_DOOR_SOLIDS} />
      <group position={COMPASS.position} rotation-y={COMPASS.rotationY}>
        <mesh material={m.compass} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[COMPASS.size, COMPASS.size]} />
        </mesh>
      </group>
    </>
  );
});
