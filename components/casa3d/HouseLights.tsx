import { memo } from 'react';
import { CEILING_LIGHTS } from '@/lib/casa3d/plan';
import { HT, X, Z } from '@/lib/casa3d/units';

/** Luz cálida (~3000 K), unidades físicas con decay 2. Ajustada a ojo con capturas. */
const COLOR = 0xffe2bd;
const INTENSITY = 6;
const DISTANCE = 6;
/** Altura de las luces bajo el techo (m). */
const DROP = 0.15;

/**
 * Luces de techo de la casa. Apagadas siguen en la escena con intensidad 0:
 * así three no recompila los shaders al pulsar el botón. No proyectan sombra.
 */
export const HouseLights = memo(function HouseLights({ on }: { on: boolean }) {
  return (
    <>
      {CEILING_LIGHTS.map(l => (
        <pointLight
          key={l.room}
          color={COLOR}
          intensity={on ? INTENSITY : 0}
          distance={DISTANCE}
          decay={2}
          position={[X(l.x), HT - DROP, Z(l.z)]}
        />
      ))}
    </>
  );
});
