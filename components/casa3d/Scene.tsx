import { OrbitControls } from '@react-three/drei';
import { VIEWS } from '@/lib/casa3d/plan';
import { C, FH } from '@/lib/casa3d/units';
import { Bathroom } from './Bathroom';
import { Bedrooms } from './Bedrooms';
import { Building } from './Building';
import { Floors } from './Floors';
import { Kitchen } from './Kitchen';
import { Living } from './Living';
import { MaterialsProvider } from './MaterialsContext';
import { Walls } from './Walls';

export interface SceneProps {
  low: boolean;
}

const SUN_POS: [number, number, number] = [C[0] - 20, C[1] + 12, C[2] + 8];

export function Scene({ low }: SceneProps) {
  return (
    <MaterialsProvider>
      <color attach="background" args={[0xf4efe8]} />
      <hemisphereLight args={[0xffffff, 0xd9c7a8, 0.67 * Math.PI]} />
      <directionalLight
        position={SUN_POS}
        intensity={Math.PI}
        color={0xfff4e0}
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
      <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI / 2 - 0.02} maxDistance={40} target={VIEWS[0].target} />

      <Building />
      <group position-y={FH}>
        <Floors />
        <Walls low={low} />
        <Kitchen />
        <Living low={low} />
        <Bedrooms />
        <Bathroom />
      </group>
    </MaterialsProvider>
  );
}
