import { WonCoin, Gem } from './icons/Currency.jsx';
import styles from './MissionCard.module.css';

// Tarjeta flotante de la misión actual. La comparten Inicio (sobre la escena
// 3D) y el Mapa, y en ambos casos es el atajo a la lección.
export default function MissionCard({ onClick }) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <span className={styles.emoji} aria-hidden="true">
        ☕
      </span>
      <span className={styles.body}>
        <span className={styles.label}>MISIÓN ACTUAL</span>
        <span className={styles.title}>Pide un café en coreano</span>
        <span className={styles.rewards}>
          <span>
            <Gem size={14} /> 150
          </span>
          <span>
            <WonCoin size={14} /> ₩2.500
          </span>
        </span>
      </span>
    </button>
  );
}
