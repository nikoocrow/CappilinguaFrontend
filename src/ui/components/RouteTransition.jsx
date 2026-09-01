import { useLayoutEffect, useRef } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { gsap, DUR, prefersReducedMotion } from '../anim/gsap.js';
import styles from './RouteTransition.module.css';

/* Fundido de entrada al cambiar de ruta. Envuelve al <Outlet> del Shell.

   Solo anima opacidad, nunca transform: un `transform` en este contenedor lo
   convertiría en bloque contenedor de sus hijos absolutos (todas las
   pantallas son `position:absolute; inset:0`) y, sobre todo, el área que mide
   el canvas de three.js cuelga de acá — moverla haría trabajar al
   ResizeObserver de Sizes en cada navegación.

   No hay animación de salida: la pantalla anterior ya se desmontó cuando
   React renderiza la nueva. Mantenerla viva exigiría duplicar el árbol, y con
   una de esas pantallas montando un contexto WebGL no vale la pena. */
export default function RouteTransition() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    const tween = gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: DUR.fast, ease: 'power2.out', clearProps: 'opacity' }
    );

    return () => tween.kill();
  }, [pathname]);

  return (
    <div ref={ref} className={styles.layer}>
      {outlet}
    </div>
  );
}
