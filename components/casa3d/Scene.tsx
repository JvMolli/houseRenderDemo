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
import { GameMode } from './GameMode';
import { HouseLights } from './HouseLights';
import { Kitchen } from './Kitchen';
import { Living } from './Living';
import { MaterialsProvider } from './MaterialsContext';
import { Parcel } from './Parcel';
import type { PhotoSpotRefs } from './PhotoButtons';
import { PhotoAnchors } from './PhotoAnchors';
import { TourRig } from './TourRig';
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
  /** Modo videojuego (texturas con relieve, cielo, reflejos y posprocesado). */
  game: boolean;
  view: ViewRequest;
  /** Botones de las fotos, que se colocan sobre el lienzo. */
  photoSpots: PhotoSpotRefs;
  /** Modo tour: la cámara recorre la casa sola. */
  tour: boolean;
  onTourStop: (index: number) => void;
  onTourEnd: () => void;
  /** Avance del tour (0..1) en cada frame: se pinta sin re-renderizar React. */
  tourProgress: (k: number) => void;
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

export function Scene({ sun, low, lights, game, view, photoSpots, tour, onTourStop, onTourEnd, tourProgress }: SceneProps) {
  // Modo videojuego: de noche la luz ambiente es la de la luna, azulada.
  const skyFill = useMemo(() => new Color().setRGB(...lerpHex(0x7f97c9, 0xffffff, sun.kd), SRGBColorSpace), [sun.kd]);
  const background = useMemo(() => new Color().setRGB(...lerpHex(SKY_NIGHT, SKY_DAY, sun.kd), SRGBColorSpace), [sun.kd]);

  return (
    <MaterialsProvider game={game}>
      <primitive attach="background" object={background} />
      <hemisphereLight
        color={game ? skyFill : 0xffffff}
        groundColor={0xd9c7a8}
        intensity={lightIntensities(sun).hemi * (game ? 1.5 - 0.75 * sun.kd : 1)}
      />
      <Sun sun={sun} ball={!game} gain={game ? 0.7 : 1} softness={game ? 3 : 1} />
      <GameMode on={game} sun={sun} />
      <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI / 2 - 0.02} maxDistance={40} />
      <CameraRig view={view} />
      <PhotoAnchors spots={photoSpots} />
      <TourRig active={tour} onStop={onTourStop} onEnd={onTourEnd} progress={tourProgress} />

      <Building />
      <Parcel />
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
