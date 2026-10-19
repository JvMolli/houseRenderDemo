import { memo, useMemo } from 'react';
import { planShape } from '@/lib/casa3d/geometry';
import { COMPASS, DRIVEWAY, FP, GROUND } from '@/lib/casa3d/plan';
import { GARAGE_SOLIDS } from '@/lib/casa3d/solids';
import { FH } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';
import { Solids } from './Solids';

const EXTRUDE = { depth: FH - 0.01, bevelEnabled: false };

/** Terreno, planta baja (garaje) con su puerta seccional y brújula. */
export const Building = memo(function Building() {
  const m = useMaterials();
  const footprint = useMemo(() => planShape(FP), []);

  return (
    <>
      <mesh material={m.ground} rotation-x={-Math.PI / 2} position={GROUND.position} receiveShadow>
        <planeGeometry args={[GROUND.size, GROUND.size]} />
      </mesh>
      <mesh material={m.driveway} rotation-x={-Math.PI / 2} position={DRIVEWAY.position} receiveShadow>
        <planeGeometry args={[...DRIVEWAY.size]} />
      </mesh>
      <mesh material={m.facade} rotation-x={-Math.PI / 2} castShadow receiveShadow>
        <extrudeGeometry args={[footprint, EXTRUDE]} />
      </mesh>
      <Solids items={GARAGE_SOLIDS} />
      <group position={COMPASS.position} rotation-y={COMPASS.rotationY}>
        <mesh material={m.compass} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[COMPASS.size, COMPASS.size]} />
        </mesh>
      </group>
    </>
  );
});
