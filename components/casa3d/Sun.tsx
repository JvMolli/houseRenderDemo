import { Color, Object3D, SRGBColorSpace } from 'three';
import { useMemo } from 'react';
import { PARCEL_CENTER } from '@/lib/casa3d/parcelShapes';
import { lerpHex, lightIntensities, SUN_HIGH, SUN_LOW, type SunState } from '@/lib/casa3d/sun';
import { C, type Vec3 } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';

const along = (from: Vec3, dir: Vec3, d: number): Vec3 => [from[0] + dir[0] * d, from[1] + dir[1] * d, from[2] + dir[2] * d];

/**
 * Sombras: la cámara de sombra se centra en la parcela (la luz y su objetivo se
 * desplazan juntos, así que la dirección del sol no cambia). ±17 m cubren toda
 * la parcela y el mapa de 3072 deja el texel en ~11 mm, igual de nítido que
 * los ±12 m con 2048 del original alrededor de la casa.
 */
const SHADOW_HALF = 17;
const SHADOW_MAP: [number, number] = [3072, 3072];

/** Luz direccional (con sombras) y esfera del sol. */
export function Sun({ sun, ball = true, gain = 1, softness = 1 }: { sun: SunState; ball?: boolean; gain?: number; softness?: number }) {
  const m = useMaterials();
  // El objetivo del sol tiene que estar en la escena para que su matriz se actualice.
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(...PARCEL_CENTER);
    return o;
  }, []);
  const color = useMemo(() => new Color().setRGB(...lerpHex(SUN_LOW, SUN_HIGH, sun.k), SRGBColorSpace), [sun.k]);

  return (
    <>
      <primitive object={target} />
      <directionalLight
        target={target}
        position={along(PARCEL_CENTER, sun.dir, 25)}
        intensity={lightIntensities(sun).sun * gain}
        color={color}
        castShadow
        shadow-mapSize={SHADOW_MAP}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={softness}
        shadow-camera-left={-SHADOW_HALF}
        shadow-camera-right={SHADOW_HALF}
        shadow-camera-top={SHADOW_HALF}
        shadow-camera-bottom={-SHADOW_HALF}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
      <mesh material={m.sun} position={along(C, sun.dir, 15)} visible={sun.up && ball}>
        <sphereGeometry args={[0.4, 16, 16]} />
      </mesh>
    </>
  );
}
