import { useNavigate } from 'react-router-dom';
import { useReveal } from '../anim/hooks.js';
import { useImmersive } from '../state/ImmersiveMode.jsx';
import GameCanvas from '../components/GameCanvas.jsx';
import MissionCard from '../components/MissionCard.jsx';
import styles from './HomeScreen.module.css';

/* Inicio es el mundo jugable: la escena de three.js ocupa toda el área de
   contenido del shell y encima solo flota lo mínimo (misión actual + ayuda).
   La tarjeta de diálogo con los NPCs no se dibuja acá: la monta el propio
   World en DOM (DialogUI), como en la versión sin shell.

   En modo inmersivo se van también estos overlays —incluidos los velos, que
   existen para fundir los bordes con el chrome que ya no está— y queda solo
   el canvas más el botón para recuperar la interfaz (tecla "i"). El HUD se
   funde con el mismo `useReveal` que el chrome del shell, así los dos salen y
   entran juntos; acá no hace falta despegar nada del flujo porque todo está
   posicionado en absoluto sobre el canvas. */
export default function HomeScreen() {
  const navigate = useNavigate();
  const { hidden } = useImmersive();
  const { scope, mounted, leaving } = useReveal(!hidden, { attr: 'data-hud', stagger: 0.05 });

  return (
    <div ref={scope} className={styles.screen}>
      <GameCanvas />

      {mounted && (
        <div className={leaving ? styles.hudLeaving : undefined}>
          <div className={styles.veilTop} data-hud="fade" />
          <div className={styles.veilBottom} data-hud="fade" />

          <div className={styles.missionSlot} data-hud="top">
            <MissionCard onClick={() => navigate('/leccion', { state: { missionId: 'coffee' } })} />
          </div>

          <p className={styles.hint} data-hud="bottom">
            Clic en el suelo para caminar · doble clic para correr · clic en un NPC para practicar
          </p>
        </div>
      )}
    </div>
  );
}
