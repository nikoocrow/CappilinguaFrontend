import { useReveal } from '../anim/hooks.js';
import { useImmersive } from '../state/ImmersiveMode.jsx';
import TopBar from './TopBar.jsx';
import Sidebar from './Sidebar.jsx';
import ImmersiveToggle from './ImmersiveToggle.jsx';
import RouteTransition from './RouteTransition.jsx';
import Toast from './Toast.jsx';
import styles from './Shell.module.css';

/* Chrome de la app: barra superior fija + sidebar + área de contenido.
   El área de contenido es `position:relative; overflow:hidden` porque es el
   contenedor que mide el canvas de three.js y sobre el que flota la UI del
   mapa. El toast vive acá para que se posicione respecto al shell.

   En modo inmersivo (Inicio) el chrome se desmonta en vez de esconderse con
   CSS: así el área de contenido crece de verdad y el ResizeObserver de Sizes
   redimensiona el canvas al alto/ancho completo (regla 28).

   El desmontaje espera al fundido (`useReveal`), pero el cambio de layout no:
   apenas empieza la salida, las ranuras pasan a `position:absolute` y el
   canvas toma su tamaño final de una sola vez, mientras el chrome se disuelve
   por encima. Redimensionar el canvas a lo largo del fundido significaría
   reasignar el drawing buffer en cada frame de la transición. */
export default function Shell() {
  const { hidden } = useImmersive();
  const { scope, mounted, leaving } = useReveal(!hidden, { attr: 'data-chrome' });

  return (
    <div ref={scope} className={styles.shell}>
      {mounted && (
        <div
          className={`${styles.topSlot} ${leaving ? styles.topLeaving : ''}`}
          data-chrome="top"
        >
          <TopBar />
        </div>
      )}
      <div className={styles.body}>
        {mounted && (
          <div
            className={`${styles.sideSlot} ${leaving ? styles.sideLeaving : ''}`}
            data-chrome="left"
          >
            <Sidebar />
          </div>
        )}
        <main className={styles.content}>
          <RouteTransition />
          <ImmersiveToggle />
          <Toast />
        </main>
      </div>
    </div>
  );
}
