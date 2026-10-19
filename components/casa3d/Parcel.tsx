import { memo, useMemo } from 'react';
import { planShape, rectPoints } from '@/lib/casa3d/geometry';
import { HATCH, LEVELS, POOL } from '@/lib/casa3d/parcel';
import {
  LANDING, OUTLINE_PLAN, PARCEL_SOLIDS, PLATFORMS, sketchRect, sketchRectCenter, STEPS, type Slab,
} from '@/lib/casa3d/parcelShapes';
import { Car } from './Car';
import { useMaterials } from './MaterialsContext';
import { People } from './People';
import { Solids } from './Solids';

const POOL_INNER = rectPoints(sketchRect(POOL.inner));
const POOL_OUTER = rectPoints(sketchRect(POOL.outer));
const WATER = sketchRectCenter(POOL.inner, LEVELS.garden - POOL.waterBelow);
const HATCH_PLANE = sketchRectCenter(HATCH, LEVELS.raised + 0.004);

/** Prisma de suelo desde la cota del jardín hasta su cara superior; los laterales son muros de contención. */
function SlabMesh({ slab }: { slab: Slab }) {
  const m = useMaterials();
  const shape = useMemo(() => planShape(slab.points), [slab]);
  const extrude = useMemo(() => ({ depth: slab.top - LEVELS.garden, bevelEnabled: false }), [slab]);
  return (
    <mesh material={[m[slab.mat], m.facade]} rotation-x={-Math.PI / 2} position-y={LEVELS.garden} castShadow receiveShadow>
      <extrudeGeometry args={[shape, extrude]} />
    </mesh>
  );
}

/**
 * Parcela según el boceto: jardín, piscina y franja de césped a la cota de la
 * planta baja; terraza y coches 1 m más arriba con sus escalones; cerramiento
 * con portón, escalera exterior, cristalera, depuradora, el coche y los
 * elementos sin aclarar.
 */
export const Parcel = memo(function Parcel() {
  const m = useMaterials();
  const garden = useMemo(() => planShape(OUTLINE_PLAN, [POOL_INNER]), []);
  const coping = useMemo(() => planShape(POOL_OUTER, [POOL_INNER]), []);
  const copingExtrude = useMemo(() => ({ depth: POOL.coping, bevelEnabled: false }), []);

  return (
    <>
      <mesh material={m.grass} rotation-x={-Math.PI / 2} position-y={LEVELS.garden} receiveShadow>
        <shapeGeometry args={[garden]} />
      </mesh>
      {[...PLATFORMS, ...STEPS, LANDING].map((s, i) => <SlabMesh key={i} slab={s} />)}

      <mesh material={m.white} rotation-x={-Math.PI / 2} position-y={LEVELS.garden} castShadow receiveShadow>
        <extrudeGeometry args={[coping, copingExtrude]} />
      </mesh>
      <mesh material={m.water} rotation-x={-Math.PI / 2} position={WATER.position} receiveShadow>
        <planeGeometry args={WATER.size} />
      </mesh>

      <mesh material={m.hatch} rotation-x={-Math.PI / 2} position={HATCH_PLANE.position} receiveShadow>
        <planeGeometry args={HATCH_PLANE.size} />
      </mesh>

      <Solids items={PARCEL_SOLIDS} />
      <Car />
      <People />
    </>
  );
});
