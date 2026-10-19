import { memo, useEffect, useMemo } from 'react';
import { buildBathFixtures } from '@/lib/casa3d/bathroom';
import { BATHROOM_SOLIDS } from '@/lib/casa3d/solids';
import { useMaterials } from './MaterialsContext';
import { Solids } from './Solids';

/**
 * Baño según la foto: mueble de roble suspendido con dos lavabos de piedra,
 * espejos redondos retroiluminados, ducha de obra con mampara, hornacina
 * iluminada, inodoro suspendido y listones de roble.
 */
export const Bathroom = memo(function Bathroom() {
  const m = useMaterials();
  const fixtures = useMemo(buildBathFixtures, []);
  useEffect(() => () => { for (const f of fixtures) f.geometry.dispose(); }, [fixtures]);
  return (
    <>
      <Solids items={BATHROOM_SOLIDS} />
      {fixtures.map(f => (
        <mesh key={f.mat} geometry={f.geometry} material={m[f.mat]} castShadow={f.mat !== 'led'} receiveShadow />
      ))}
    </>
  );
});
