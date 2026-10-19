import { memo } from 'react';
import { AMBILIGHT, AMBILIGHT_LIGHTS } from '@/lib/casa3d/plan';
import { LIVING_SOLIDS } from '@/lib/casa3d/solids';
import { X } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';
import { Solids } from './Solids';

/**
 * PointLight del ambilight en unidades físicas (decay 2). En r128 eran 0,8 con
 * distance 1,8 y caída lineal; estos valores están ajustados para que el
 * resplandor en la pared se parezca al original a las 17:30.
 */
const AMBI_INTENSITY = 1.0;
const AMBI_DISTANCE = 2.3;

/** Mueble TV, TV con ambilight, hornacina, alfombra, butacas, mesa y sofá. */
export const Living = memo(function Living({ low }: { low: boolean }) {
  const m = useMaterials();
  return (
    <>
      <Solids items={LIVING_SOLIDS} />
      <mesh material={m.ambilight} position={[X(AMBILIGHT.x), AMBILIGHT.y, AMBILIGHT.z]} visible={!low}>
        <planeGeometry args={[...AMBILIGHT.size]} />
      </mesh>
      {AMBILIGHT_LIGHTS.map(l => (
        <pointLight
          key={l.x}
          color={l.color}
          intensity={AMBI_INTENSITY}
          distance={AMBI_DISTANCE}
          decay={2}
          position={[X(l.x), l.y, l.z]}
        />
      ))}
    </>
  );
});
