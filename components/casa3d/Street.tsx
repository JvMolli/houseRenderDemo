import { memo, useEffect, useMemo } from 'react';
import { Shape, ShapeGeometry, Vector2, type Material } from 'three';
import { LEVELS, STREET } from '@/lib/casa3d/parcel';
import { STREET_BANDS, STREET_SOLIDS, STREET_SOLIDS_LONG, STREET_SPAN } from '@/lib/casa3d/parcelShapes';
import { useGame, useMaterials } from './MaterialsContext';
import { Solids } from './Solids';

/** Franja horizontal de x0..x1 por z0..z1 (m), con UV en metros como los demás suelos. */
function Strip({ x, z, material }: { x: readonly [number, number]; z: readonly [number, number]; material: Material }) {
  const geometry = useMemo(() => new ShapeGeometry(new Shape([
    new Vector2(x[0], -z[0]), new Vector2(x[1], -z[0]), new Vector2(x[1], -z[1]), new Vector2(x[0], -z[1]),
  ])), [x, z]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} rotation-x={-Math.PI / 2} position-y={LEVELS.outside + STREET.lift} receiveShadow />;
}

/**
 * Calle del pueblo frente al portón: acera, bordillo con vado y calzada de
 * asfalto. Cubre el terreno de la maqueta; en el modo videojuego sigue hasta
 * el horizonte, como el campo.
 */
export const Street = memo(function Street() {
  const m = useMaterials();
  const span = useGame() ? STREET_SPAN.horizon : STREET_SPAN.ground;
  return (
    <>
      <Strip x={STREET_BANDS.sidewalk} z={span} material={m.carsPaving} />
      <Strip x={[STREET_BANDS.road[0], STREET_BANDS.kerb[1]]} z={span} material={m.asphalt} />
      <Solids items={span === STREET_SPAN.horizon ? STREET_SOLIDS_LONG : STREET_SOLIDS} />
    </>
  );
});
