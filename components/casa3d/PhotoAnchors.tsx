import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Vector3 } from 'three';
import { PHOTOS } from '@/lib/casa3d/plan';
import { FH, X, Z } from '@/lib/casa3d/units';
import type { PhotoSpotRefs } from './PhotoButtons';

/** Proyecta la posición 3D de cada foto a la pantalla y mueve su botón; lo oculta si queda fuera de cámara. */
export function PhotoAnchors({ spots }: { spots: PhotoSpotRefs }) {
  const points = useMemo(() => PHOTOS.map(p => ({ id: p.id, world: new Vector3(X(p.x), FH + p.y, Z(p.z)) })), []);
  const v = useMemo(() => new Vector3(), []);

  useFrame(({ camera, size }) => {
    for (const p of points) {
      const el = spots.current.get(p.id);
      if (!el) continue;
      v.copy(p.world).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1;
      el.style.visibility = visible ? 'visible' : 'hidden';
      el.style.transform = `translate(${(v.x + 1) / 2 * size.width}px, ${(1 - v.y) / 2 * size.height}px) translate(-50%, -50%)`;
    }
  });

  return null;
}
