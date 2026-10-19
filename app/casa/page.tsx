import type { Metadata } from 'next';
import Casa3D from '@/components/casa3d/Casa3D';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Casa 3D',
};

export default function CasaPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Casa 3D</h1>
      <Casa3D />
    </main>
  );
}
