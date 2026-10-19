import { memo, useEffect, useMemo } from 'react';
import { buildCar } from '@/lib/casa3d/car';
import { CAR, fromSketch, LEVELS } from '@/lib/casa3d/parcel';
import { X, Z } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';

const [cx, cz] = fromSketch(CAR.center);
/** El coche mira hacia la casa (+X): aparcado de frente. */
const POSITION: [number, number, number] = [X(cx) - CAR.length / 2, LEVELS.raised, Z(cz)];

/** Citroën C3 en la zona de coches. */
export const Car = memo(function Car() {
  const m = useMaterials();
  const parts = useMemo(buildCar, []);
  useEffect(() => () => { for (const p of parts) p.geometry.dispose(); }, [parts]);
  return (
    <group position={POSITION}>
      {parts.map(p => <mesh key={p.mat} geometry={p.geometry} material={m[p.mat]} castShadow receiveShadow />)}
    </group>
  );
});
