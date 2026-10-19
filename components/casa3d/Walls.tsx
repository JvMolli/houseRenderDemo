import { memo } from 'react';
import { FP_BOUNDS, SHADOW_CEILING_THICKNESS } from '@/lib/casa3d/plan';
import { WALL_SOLIDS } from '@/lib/casa3d/solids';
import { HT, X, Z } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';
import { Solids } from './Solids';

const [cx1, cz1, cx2, cz2] = FP_BOUNDS;
const CEILING_SIZE: [number, number, number] = [X(cx2) - X(cx1), SHADOW_CEILING_THICKNESS, Z(cz2) - Z(cz1)];
const CEILING_POS: [number, number, number] = [(X(cx1) + X(cx2)) / 2, HT + SHADOW_CEILING_THICKNESS / 2, (Z(cz1) + Z(cz2)) / 2];

/**
 * Muros con huecos, correderas, pilar y chaflán (se bajan a 0,4 de altura con
 * `low`) y el techo invisible que solo proyecta sombra, para que el sol entre
 * únicamente por las ventanas.
 */
export const Walls = memo(function Walls({ low }: { low: boolean }) {
  const m = useMaterials();
  return (
    <>
      <group scale-y={low ? 0.4 : 1}>
        <Solids items={WALL_SOLIDS} />
      </group>
      <mesh material={m.ceiling} position={CEILING_POS} castShadow visible={!low}>
        <boxGeometry args={CEILING_SIZE} />
      </mesh>
    </>
  );
});
