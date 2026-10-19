import type { CSSProperties } from 'react';
import { cssColor, FINISHES, finishOption, type FinishConfig, type FinishOption, type FinishTexture } from '@/lib/casa3d/config';
import styles from './Casa3D.module.css';

/** Muestra de las opciones con textura: un dibujo en CSS que la recuerda. */
const PATTERNS: Record<FinishTexture, string> = {
  oakFloor: 'repeating-linear-gradient(90deg, transparent 0 9px, rgba(90,60,30,0.35) 9px 10px), repeating-linear-gradient(100deg, #c29a6b 0 3px, #b0875a 3px 5px)',
  oak: 'repeating-linear-gradient(100deg, #d6b283 0 3px, #c49a6c 3px 5px)',
  whiteMarble: 'linear-gradient(135deg, #ebe7e1 38%, #a9a6a0 44%, #ebe7e1 50%, #ebe7e1 70%, #c8c5bf 73%, #ebe7e1 76%)',
  granite: 'radial-gradient(#3b3b3b 20%, transparent 22%) 0 0 / 6px 6px, radial-gradient(#e2e2df 20%, transparent 22%) 3px 3px / 6px 6px, #8a8986',
};

const swatchStyle = (o: FinishOption): CSSProperties =>
  ({ background: o.texture ? PATTERNS[o.texture] : cssColor(o.color) });

/** Panel del configurador: un apartado por acabado, con una muestra por opción. */
export function Configurator({ config, onChange, onReset, onClose }: {
  config: FinishConfig;
  onChange: (slot: string, option: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <aside className={styles.config} aria-label="Configurador">
      <div className={styles.configHead}>
        <h2>Configurador</h2>
        <button type="button" onClick={onReset}>Restablecer</button>
        <button type="button" className={styles.configClose} aria-label="Cerrar configurador" onClick={onClose}>×</button>
      </div>
      {FINISHES.map(slot => {
        const current = finishOption(slot, config);
        return (
          <fieldset key={slot.id} className={styles.configSlot}>
            <legend>{slot.label} <span>{current.label}</span></legend>
            <div className={styles.swatches}>
              {slot.options.map(o => (
                <button
                  key={o.id}
                  type="button"
                  title={o.label}
                  aria-label={o.label}
                  aria-pressed={o.id === current.id}
                  className={styles.swatch}
                  style={swatchStyle(o)}
                  onClick={() => onChange(slot.id, o.id)}
                />
              ))}
            </div>
          </fieldset>
        );
      })}
    </aside>
  );
}
