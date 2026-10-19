import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Vector3 } from 'three';
import { TOUR } from '@/lib/casa3d/plan';
import { holdPose, TOUR_HOLD, tourSegment, travelPose, type Pose } from '@/lib/casa3d/tour';

type Controls = { enabled: boolean; target: Vector3; update(): void };

interface TourState {
  index: number;
  phase: 'travel' | 'hold';
  t: number;
  from: Pose;
  seg: { duration: number; arc: number };
}

/**
 * Lleva la cámara por las paradas del tour mientras `active`. Mientras dura,
 * los controles de órbita quedan desactivados; al salir se devuelven donde
 * esté la cámara. `onStop` recibe el índice de cada parada al empezar a ir hacia
 * ella y `progress` (0..1) del tour completo en cada frame; `onEnd`, al terminar.
 */
export function TourRig({ active, onStop, onEnd, progress }: {
  active: boolean;
  onStop: (index: number) => void;
  onEnd: () => void;
  progress: (k: number) => void;
}) {
  const camera = useThree(s => s.camera);
  const controls = useThree(s => s.controls) as Controls | null;
  const st = useRef<TourState | null>(null);

  useEffect(() => {
    if (!active || !controls) return;
    controls.enabled = false;
    const from: Pose = { position: camera.position.toArray(), target: controls.target.toArray() };
    st.current = { index: 0, phase: 'travel', t: 0, from, seg: tourSegment(from, TOUR[0]) };
    onStop(0);
    return () => {
      st.current = null;
      controls.enabled = true;
      controls.update();
    };
  }, [active, controls, camera, onStop]);

  useFrame((_, dt) => {
    const s = st.current;
    if (!s || !controls) return;
    s.t += Math.min(dt, 0.1);
    const stop = TOUR[s.index];
    let pose: Pose;
    if (s.phase === 'travel') {
      const u = s.t / s.seg.duration;
      pose = travelPose(s.from, stop, u, s.seg.arc);
      if (u >= 1) { s.phase = 'hold'; s.t = 0; }
    } else {
      pose = holdPose(stop, s.t / TOUR_HOLD);
      if (s.t >= TOUR_HOLD) {
        if (s.index === TOUR.length - 1) {
          st.current = null;
          onEnd();
        } else {
          s.index++;
          s.phase = 'travel';
          s.t = 0;
          s.from = pose;
          s.seg = tourSegment(pose, TOUR[s.index]);
          onStop(s.index);
        }
      }
    }
    camera.position.set(...pose.position);
    controls.target.set(...pose.target);
    camera.lookAt(controls.target);
    const within = s.phase === 'travel' ? Math.min(1, s.t / s.seg.duration) * 0.5 : 0.5 + 0.5 * Math.min(1, s.t / TOUR_HOLD);
    progress((s.index + within) / TOUR.length);
  });

  return null;
}
