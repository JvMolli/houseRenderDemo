'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import { PHOTOS } from '@/lib/casa3d/plan';
import { sunState, type Season } from '@/lib/casa3d/sun';
import styles from './Casa3D.module.css';
import { Controls } from './Controls';
import { PhotoButtons } from './PhotoButtons';
import { PhotoViewer } from './PhotoViewer';
import type { ViewRequest } from './Scene';

// Three y R3F solo en cliente: la UI se renderiza en servidor y el Canvas se carga aparte.
const Viewer = dynamic(() => import('./Viewer'), { ssr: false });

export default function Casa3D() {
  const [hour, setHour] = useState(17.5);
  const [season, setSeason] = useState<Season>('equinoccio');
  const [low, setLow] = useState(false);
  const [lights, setLights] = useState(false);
  const [view, setView] = useState<ViewRequest>({ index: 0, seq: 0 });
  const [photoId, setPhotoId] = useState<string | null>(null);
  const photoSpots = useRef(new Map<string, HTMLElement>());
  const sun = useMemo(() => sunState(hour, season), [hour, season]);
  const photo = PHOTOS.find(p => p.id === photoId);

  return (
    <>
      <div className={styles.wrap}>
        <Viewer sun={sun} low={low} lights={lights} view={view} photoSpots={photoSpots} />
        <PhotoButtons spots={photoSpots} onOpen={setPhotoId} />
      </div>
      <Controls
        hour={hour}
        season={season}
        low={low}
        lights={lights}
        sun={sun}
        onView={index => setView(v => ({ index, seq: v.seq + 1 }))}
        onToggleWalls={() => setLow(l => !l)}
        onToggleLights={() => setLights(l => !l)}
        onHour={setHour}
        onSeason={setSeason}
      />
      {photo && <PhotoViewer key={photo.id} photo={photo} onClose={() => setPhotoId(null)} />}
    </>
  );
}
