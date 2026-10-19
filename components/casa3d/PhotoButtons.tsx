import type { RefObject } from 'react';
import { PHOTOS } from '@/lib/casa3d/plan';
import styles from './Casa3D.module.css';

/** Botón DOM de cada foto, por id. PhotoAnchors los coloca sobre el lienzo en cada frame. */
export type PhotoSpotRefs = RefObject<Map<string, HTMLElement>>;

/**
 * Iconos de "ver foto" sobre el lienzo. Son HTML normal (no <Html> de drei,
 * que crea otra raíz de React); empiezan ocultos hasta que se proyectan.
 */
export function PhotoButtons({ spots, onOpen }: { spots: PhotoSpotRefs; onOpen: (id: string) => void }) {
  return (
    <>
      {PHOTOS.map(p => (
        <button
          key={p.id}
          ref={el => {
            if (el) spots.current.set(p.id, el);
            else spots.current.delete(p.id);
          }}
          type="button"
          className={styles.photoSpot}
          onClick={() => onOpen(p.id)}
          aria-label={`Ver foto: ${p.label}`}
          title={p.label}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      ))}
    </>
  );
}
