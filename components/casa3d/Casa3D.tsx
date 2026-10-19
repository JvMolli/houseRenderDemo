'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PHOTOS, TOUR } from '@/lib/casa3d/plan';
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
  const [game, setGame] = useState(false);
  const [view, setView] = useState<ViewRequest>({ index: 0, seq: 0 });
  const [photoId, setPhotoId] = useState<string | null>(null);
  const photoSpots = useRef(new Map<string, HTMLElement>());
  const [tour, setTour] = useState(false);
  const [tourStop, setTourStop] = useState(0);
  const tourBar = useRef<HTMLDivElement>(null);
  const endTour = useCallback(() => setTour(false), []);
  const tourProgress = useCallback((k: number) => {
    if (tourBar.current) tourBar.current.style.transform = `scaleX(${k})`;
  }, []);

  // Esc sale del tour
  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTour(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tour]);
  const sun = useMemo(() => sunState(hour, season), [hour, season]);
  const photo = PHOTOS.find(p => p.id === photoId);

  return (
    <>
      <div className={styles.wrap}>
        <Viewer
          sun={sun} low={low} lights={lights} game={game} view={view} photoSpots={photoSpots}
          tour={tour} onTourStop={setTourStop} onTourEnd={endTour} tourProgress={tourProgress}
        />
        <PhotoButtons spots={photoSpots} onOpen={setPhotoId} />
        {tour && (
          <div className={styles.tourCaption} aria-live="polite">
            <span className={styles.tourCount}>{tourStop + 1}/{TOUR.length}</span>
            <span>{TOUR[tourStop].label}</span>
            <div className={styles.tourTrack}><div ref={tourBar} className={styles.tourBar} /></div>
          </div>
        )}
      </div>
      <Controls
        hour={hour}
        season={season}
        low={low}
        lights={lights}
        game={game}
        tour={tour}
        sun={sun}
        onView={index => { setTour(false); setView(v => ({ index, seq: v.seq + 1 })); }}
        onToggleWalls={() => setLow(l => !l)}
        onToggleLights={() => setLights(l => !l)}
        onToggleGame={() => setGame(g => !g)}
        onToggleTour={() => setTour(t => !t)}
        onHour={setHour}
        onSeason={setSeason}
      />
      {photo && <PhotoViewer key={photo.id} photo={photo} onClose={() => setPhotoId(null)} />}
    </>
  );
}
