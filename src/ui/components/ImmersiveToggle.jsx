import { DUR } from '../anim/gsap.js';
import { usePopIn } from '../anim/hooks.js';
import { useImmersive } from '../state/ImmersiveMode.jsx';
import { PanelIcon, ExpandIcon } from './icons/Icons.jsx';
import styles from './ImmersiveToggle.module.css';

/* Único punto de entrada visible cuando el chrome está oculto: 44×44, arriba
   a la izquierda del área de contenido. Duplica el atajo de teclado "i" para
   quien no lo conoce. */
export default function ImmersiveToggle() {
  const { hidden, canImmerse, toggle, toggleKey } = useImmersive();
  if (!canImmerse) return null;

  // `key` remonta el botón al cambiar de modo: así su entrada vuelve a
  // correr cuando el chrome se va y queda solo sobre el canvas.
  return <ToggleButton key={String(hidden)} hidden={hidden} toggle={toggle} toggleKey={toggleKey} />;
}

function ToggleButton({ hidden, toggle, toggleKey }) {
  // Al entrar en modo inmersivo espera a que el chrome termine de fundirse:
  // si apareciera al mismo tiempo, se cruzaría con la barra que se va.
  const ref = usePopIn({ y: -8, scale: 0.9, delay: hidden ? DUR.fast : 0 });

  const label = hidden ? 'Mostrar interfaz' : 'Ocultar interfaz';

  return (
    <button
      ref={ref}
      type="button"
      className={styles.button}
      onClick={toggle}
      aria-pressed={!hidden}
      aria-label={label}
      title={`${label} (${toggleKey.toUpperCase()})`}
    >
      {hidden ? <PanelIcon size={20} /> : <ExpandIcon size={20} />}
    </button>
  );
}
