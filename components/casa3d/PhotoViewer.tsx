import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { Photo } from '@/lib/casa3d/plan';
import styles from './Casa3D.module.css';

/** Visor modal de una foto: <dialog> nativo (Esc, foco y capa superior gratis). Cierra al pulsar fuera. */
export function PhotoViewer({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  // Sin limpieza: close() dispararía onClose (y en modo estricto cerraría el visor
  // nada más abrirlo); al desmontar, el navegador saca el diálogo de la capa superior.
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.photoDialog}
      aria-label={photo.label}
      onClose={onClose}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Image src={photo.src} alt={photo.label} width={photo.width} height={photo.height} sizes="92vw" className={styles.photo} />
      <button type="button" className={styles.photoClose} onClick={onClose} aria-label="Cerrar foto">×</button>
    </dialog>
  );
}
