import { useState } from 'react';
import { useScreenEnter } from '../anim/hooks.js';
import { useNavigate } from 'react-router-dom';
import { useAppState, formatWon } from '../state/AppState.jsx';
import { MISSIONS, MISSION_TABS, missionStatus } from '../data/missions.js';
import Button from '../components/Button.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { WonCoin, Gem } from '../components/icons/Currency.jsx';
import styles from './MissionsScreen.module.css';

export default function MissionsScreen() {
  const navigate = useNavigate();
  const { level, claimedMissions, claimMission, addReward, showToast } = useAppState();
  const [tab, setTab] = useState('diarias');
  // Cambiar de pestaña reescalona solo la lista, no el encabezado.
  const scope = useScreenEnter({ replayKey: tab });

  const missions = MISSIONS.filter((mission) => mission.tab === tab);

  const handleClaim = (mission) => {
    // claimMission devuelve false si ya estaba reclamada: la recompensa se
    // otorga una sola vez aunque llegue un doble click.
    if (!claimMission(mission.id)) return;
    addReward({ xp: mission.xp, coins: mission.coins });
    showToast(`¡Recompensa reclamada! +${mission.xp} XP · +₩${formatWon(mission.coins)}`);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.backdrop} />

      <div ref={scope} className={styles.content}>
        <h1 className={styles.title} data-anim="head">Misiones</h1>
        <p className={styles.subtitle} data-anim="head">
          Completa retos, gana XP y desbloquea nuevos lugares de Seúl.
        </p>

        <div className={styles.tabs} data-anim="head" role="tablist" aria-label="Tipo de misión">
          {MISSION_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {missions.map((mission) => {
            const status = missionStatus(mission, { level, claimedMissions });
            const locked = status === 'bloqueada';
            const goldBar = status === 'reclamable' || status === 'reclamada';

            return (
              <article
                key={mission.id}
                className={`${styles.card} ${locked ? styles.cardLocked : ''}`}
                data-anim="item"
              >
                <div className={styles.emoji} aria-hidden="true">
                  {mission.emoji}
                </div>

                <div className={styles.body}>
                  <h2 className={styles.cardTitle}>{mission.title}</h2>
                  <p className={styles.cardDescription}>{mission.description}</p>

                  <div className={styles.progressRow}>
                    <div className={styles.progressTrack}>
                      <ProgressBar
                        value={mission.progress}
                        max={mission.total}
                        height={10}
                        fill={goldBar ? 'var(--grad-reward)' : 'var(--grad-primary)'}
                        label={`Progreso de ${mission.title}`}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {mission.progress}/{mission.total}
                    </span>
                  </div>
                </div>

                <div className={styles.side}>
                  <div className={styles.rewards}>
                    <span className={styles.reward}>
                      <Gem size={16} /> {mission.xp} XP
                    </span>
                    <span className={styles.reward}>
                      <WonCoin size={16} /> ₩{formatWon(mission.coins)}
                    </span>
                  </div>

                  <MissionAction
                    status={status}
                    mission={mission}
                    onContinue={() => navigate('/leccion', { state: { missionId: mission.id } })}
                    onClaim={() => handleClaim(mission)}
                    onLocked={() =>
                      showToast(`🔒 Alcanza el nivel ${mission.requiredLevel} para desbloquear`)
                    }
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MissionAction({ status, mission, onContinue, onClaim, onLocked }) {
  if (status === 'bloqueada') {
    // No lleva `disabled` real: un botón deshabilitado no emite click y el
    // handoff pide que al tocarlo salte el toast de "alcanza el nivel N".
    return (
      <Button variant="done" size="sm" aria-disabled="true" className={styles.locked} onClick={onLocked}>
        Nivel {mission.requiredLevel}
      </Button>
    );
  }

  if (status === 'reclamada') {
    return (
      <Button variant="done" size="sm" disabled>
        Reclamado ✓
      </Button>
    );
  }

  if (status === 'reclamable') {
    return (
      <Button variant="gold" size="sm" onClick={onClaim}>
        Reclamar
      </Button>
    );
  }

  return (
    <Button variant="primary" size="sm" onClick={onContinue}>
      Continuar
    </Button>
  );
}
