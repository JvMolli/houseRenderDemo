import { VIEWS } from '@/lib/casa3d/plan';
import { describeSun, formatHour, SEASONS, type Season, type SunState } from '@/lib/casa3d/sun';
import styles from './Casa3D.module.css';

interface ControlsProps {
  hour: number;
  season: Season;
  low: boolean;
  lights: boolean;
  game: boolean;
  tour: boolean;
  sun: SunState;
  onView: (index: number) => void;
  onToggleWalls: () => void;
  onToggleLights: () => void;
  onToggleGame: () => void;
  onToggleTour: () => void;
  onHour: (hour: number) => void;
  onSeason: (season: Season) => void;
}

/** Botones de vista, bajar/subir paredes, luces, slider de hora y estaciones. */
export function Controls({
  hour, season, low, lights, game, tour, sun, onView, onToggleWalls, onToggleLights, onToggleGame, onToggleTour, onHour, onSeason,
}: ControlsProps) {
  return (
    <>
      <div className={styles.row}>
        {VIEWS.map((v, i) => (
          <button key={v.label} type="button" onClick={() => onView(i)}>{v.label}</button>
        ))}
        <button type="button" onClick={onToggleWalls}>{low ? 'Subir paredes' : 'Bajar paredes'}</button>
        <button type="button" className={lights ? styles.active : undefined} aria-pressed={lights} onClick={onToggleLights}>
          {lights ? 'Apagar luces' : 'Encender luces'}
        </button>
        <button type="button" className={game ? styles.active : undefined} aria-pressed={game} onClick={onToggleGame}>
          Modo videojuego
        </button>
        <button type="button" className={tour ? styles.active : undefined} aria-pressed={tour} onClick={onToggleTour}>
          {tour ? 'Parar tour' : 'Modo tour'}
        </button>
      </div>

      <div className={`${styles.row} ${styles.timeRow}`}>
        <svg className={styles.sunIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <input
          type="range"
          min={6}
          max={22.5}
          step={0.25}
          value={hour}
          onChange={e => onHour(Number(e.target.value))}
          aria-label="Hora del día"
        />
        <span className={styles.hour}>{formatHour(hour)}</span>
      </div>

      <div className={styles.row}>
        {(Object.keys(SEASONS) as Season[]).map(s => (
          <button key={s} type="button" className={s === season ? styles.active : undefined} onClick={() => onSeason(s)}>
            {SEASONS[s].label}
          </button>
        ))}
      </div>
      <p className={styles.info}>{describeSun(sun)}</p>
    </>
  );
}
