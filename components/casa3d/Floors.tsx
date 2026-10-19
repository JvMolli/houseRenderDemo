import type { Material } from 'three';
import { memo, useMemo } from 'react';
import { planShape } from '@/lib/casa3d/geometry';
import { BATH_FLOOR, FP, SHOWER_FLOOR, type Pt } from '@/lib/casa3d/plan';
import { useMaterials } from './MaterialsContext';

/** poly(): contorno del plano tumbado en el suelo a la altura y (m). */
function Poly({ points, y, material }: { points: readonly Pt[]; y: number; material: Material }) {
  const shape = useMemo(() => planShape(points), [points]);
  return (
    <mesh material={material} rotation-x={-Math.PI / 2} position-y={y} receiveShadow>
      <shapeGeometry args={[shape]} />
    </mesh>
  );
}

/** Porcelánico beige claro de todo el piso, tarima de roble del baño y plato de ducha. */
export const Floors = memo(function Floors() {
  const m = useMaterials();
  return (
    <>
      <Poly points={FP} y={0} material={m.floor} />
      <Poly points={BATH_FLOOR.points} y={BATH_FLOOR.y} material={m.bathOak} />
      <Poly points={SHOWER_FLOOR.points} y={SHOWER_FLOOR.y} material={m.slate} />
    </>
  );
});
