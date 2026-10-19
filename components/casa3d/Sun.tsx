import { Color, Object3D, SRGBColorSpace } from 'three';
import { useMemo } from 'react';
import { lerpHex, lightIntensities, SUN_HIGH, SUN_LOW, type SunState } from '@/lib/casa3d/sun';
import { C, type Vec3 } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';

const along = (dir: Vec3, d: number): Vec3 => [C[0] + dir[0] * d, C[1] + dir[1] * d, C[2] + dir[2] * d];

/** Luz direccional (con sombras) y esfera del sol. */
export function Sun({ sun }: { sun: SunState }) {
  const m = useMaterials();
  // El objetivo del sol tiene que estar en la escena para que su matriz se actualice.
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(...C);
    return o;
  }, []);
  const color = useMemo(() => new Color().setRGB(...lerpHex(SUN_LOW, SUN_HIGH, sun.k), SRGBColorSpace), [sun.k]);

  return (
    <>
      <primitive object={target} />
      <directionalLight
        target={target}
        position={along(sun.dir, 25)}
        intensity={lightIntensities(sun).sun}
        color={color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
      <mesh material={m.sun} position={along(sun.dir, 15)} visible={sun.up}>
        <sphereGeometry args={[0.4, 16, 16]} />
      </mesh>
    </>
  );
}
