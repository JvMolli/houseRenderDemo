import { Canvas } from '@react-three/fiber';
import { VIEWS } from '@/lib/casa3d/plan';
import { Scene, type SceneProps } from './Scene';

const CAMERA = { fov: 50, near: 0.1, far: 120, position: VIEWS[0].position };
const DPR: [number, number] = [1, 2];

/**
 * Canvas de three. Solo cliente: se carga con next/dynamic y ssr:false.
 * `flat` = sin tone mapping, como el original. Sombras PCF (en three r18x
 * PCFSoftShadowMap ya no existe y PCFShadowMap es la versión suave).
 * La escena es estática: solo se renderiza cuando algo cambia (órbita con
 * inercia, hora, vista o paredes), así en reposo no gasta GPU.
 */
export default function Viewer(props: SceneProps) {
  return (
    <Canvas frameloop="demand" shadows="percentage" flat dpr={DPR} camera={CAMERA}>
      <Scene {...props} />
    </Canvas>
  );
}
