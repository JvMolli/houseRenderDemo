import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Color, SRGBColorSpace, type Vector3 } from 'three';
import { VIEWS } from '@/lib/casa3d/plan';
import { lerpHex, lightIntensities, SKY_DAY, SKY_NIGHT, type SunState } from '@/lib/casa3d/sun';
import { FH } from '@/lib/casa3d/units';
import { Bathroom } from './Bathroom';
import { Bedrooms } from './Bedrooms';
import { Building } from './Building';
import { Floors } from './Floors';
import { HouseLights } from './HouseLights';
import { Kitchen } from './Kitchen';
import { Living } from './Living';
import { MaterialsProvider } from './MaterialsContext';
import { Sun } from './Sun';
import { Walls } from './Walls';

/** Petición de vista: `seq` cambia en cada clic para poder repetir la misma vista. */
export interface ViewRequest {
  index: number;
  seq: number;
}

export interface SceneProps {
  sun: SunState;
  low: boolean;
  lights: boolean;
  view: ViewRequest;
}

/** Mueve cámara y objetivo de los controles al pulsar una vista. */
function CameraRig({ view }: { view: ViewRequest }) {
  const camera = useThree(s => s.camera);
  const controls = useThree(s => s.controls) as { target: Vector3; update(): void } | null;
  useEffect(() => {
    if (!controls) return;
    const v = VIEWS[view.index];
    camera.position.set(...v.position);
    controls.target.set(...v.target);
    controls.update();
  }, [view, camera, controls]);
  return null;
}

export function Scene({ sun, low, lights, view }: SceneProps) {
  const background = useMemo(() => new Color().setRGB(...lerpHex(SKY_NIGHT, SKY_DAY, sun.kd), SRGBColorSpace), [sun.kd]);

  return (
    <MaterialsProvider>
      <primitive attach="background" object={background} />
      <hemisphereLight args={[0xffffff, 0xd9c7a8]} intensity={lightIntensities(sun).hemi} />
      <Sun sun={sun} />
      <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI / 2 - 0.02} maxDistance={40} />
      <CameraRig view={view} />

      <Building />
      <group position-y={FH}>
        <Floors />
        <Walls low={low} />
        <Kitchen />
        <Living low={low} />
        <Bedrooms />
        <Bathroom />
        <HouseLights on={lights} />
      </group>
    </MaterialsProvider>
  );
}
