import { memo, useEffect, useMemo } from 'react';
import { buildMotorcycle } from '@/lib/casa3d/motorcycle';
import { fromSketch, LEVELS, MOTORCYCLE } from '@/lib/casa3d/parcel';
import { X, Z } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';

const [mx, mz] = fromSketch(MOTORCYCLE.center);
const POSITION: [number, number, number] = [X(mx), LEVELS.raised, Z(mz)];

/** Harley-Davidson azul junto al coche. */
export const Motorcycle = memo(function Motorcycle() {
  const m = useMaterials();
  const parts = useMemo(buildMotorcycle, []);
  useEffect(() => () => { for (const p of parts) p.geometry.dispose(); }, [parts]);
  return (
    <group position={POSITION} rotation-x={-MOTORCYCLE.lean}>
      {parts.map(p => <mesh key={p.mat} geometry={p.geometry} material={m[p.mat]} castShadow receiveShadow />)}
    </group>
  );
});
