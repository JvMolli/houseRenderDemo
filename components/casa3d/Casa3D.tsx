'use client';

import dynamic from 'next/dynamic';
import styles from './Casa3D.module.css';

// Three y R3F solo en cliente.
const Viewer = dynamic(() => import('./Viewer'), { ssr: false });

export default function Casa3D() {
  return (
    <div className={styles.wrap}>
      <Viewer low={false} />
    </div>
  );
}
