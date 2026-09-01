import { useNavigate } from 'react-router-dom';
import { useTweenedNumber } from '../anim/hooks.js';
import { useAppState, formatWon } from '../state/AppState.jsx';
import { LevelToken, WonCoin, Gem } from './icons/Currency.jsx';
import { SettingsIcon } from './icons/Icons.jsx';
import ProgressBar from './ProgressBar.jsx';
import styles from './TopBar.module.css';

export default function TopBar() {
  const navigate = useNavigate();
  const { level, xp, xpMax, coins, gems } = useAppState();

  /* Los saldos se interpolan al cambiar: comprar en la tienda descuenta con
     un conteo en vez de un salto seco, que es lo que hace legible de dónde
     salió el gasto. El texto lo escribe GSAP sobre estos nodos (por eso van
     vacíos en el JSX), no un estado de React por frame. */
  const coinsRef = useTweenedNumber(coins, (n) => `₩${formatWon(n)}`);
  const gemsRef = useTweenedNumber(gems, formatWon);
  const xpRef = useTweenedNumber(xp, formatWon);

  return (
    <header className={styles.topbar}>
      <div className={styles.logo}>
        <img className={styles.logoAvatar} src="/ui/capy.png" alt="" />
        <div>
          <div className={styles.wordmark}>CAPPILINGUA</div>
          <div className={styles.tagline}>APRENDE · EXPLORA · CONECTA</div>
        </div>
      </div>

      <div className={styles.levelCapsule}>
        <LevelToken level={level} />
        <div className={styles.levelInfo}>
          <div className={styles.levelLabel}>NIVEL {level}</div>
          <ProgressBar
            value={xp}
            max={xpMax}
            height={11}
            fill="var(--grad-xp)"
            label={`Experiencia: ${xp} de ${xpMax}`}
          />
        </div>
        <div className={styles.xpText}>
          <span ref={xpRef} /> / {formatWon(xpMax)} XP
        </div>
      </div>

      <div className={styles.spacer} />

      <div className={styles.balance}>
        <WonCoin />
        <span ref={coinsRef} />
      </div>
      <div className={styles.balance}>
        <Gem />
        <span ref={gemsRef} />
      </div>

      {/* TEMPORAL: Ajustes es todavía fase 2, así que su botón sirve de
          atajo para revisar la pantalla de login. Al implementar Ajustes,
          volver al toast y sacar el atajo (también en Sidebar.jsx). */}
      <button
        type="button"
        className={styles.iconButton}
        aria-label="Ver la interfaz de login (temporal)"
        title="Temporal: ver la interfaz de login"
        onClick={() => navigate('/login')}
      >
        <SettingsIcon size={20} />
      </button>
    </header>
  );
}
