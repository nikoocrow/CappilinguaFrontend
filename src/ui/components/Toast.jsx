import { usePopIn } from '../anim/hooks.js';
import { useAppState } from '../state/AppState.jsx';
import styles from './Toast.module.css';

// Notificación efímera centrada abajo. `key` fuerza el remonte para que la
// animación de entrada vuelva a correr cuando llega un toast nuevo mientras
// hay otro en pantalla.
export default function Toast() {
  const { toast } = useAppState();
  if (!toast) return null;

  return <ToastCard key={toast.id} message={toast.message} />;
}

/* Componente aparte porque los hooks no pueden ir después del `return null`.
   La capa centra con flex y no con `translateX(-50%)`: el transform es de
   GSAP mientras dura la entrada, y compartirlo con el centrado descolocaría
   la tarjeta. */
function ToastCard({ message }) {
  const ref = usePopIn({ y: 16, scale: 0.94 });

  return (
    <div className={styles.layer}>
      <div ref={ref} className={styles.toast} role="status" aria-live="polite">
        {message}
      </div>
    </div>
  );
}
