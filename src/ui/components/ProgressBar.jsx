import { useLayoutEffect, useRef } from 'react';
import { gsap, DUR, prefersReducedMotion } from '../anim/gsap.js';
import styles from './ProgressBar.module.css';

// Barra de progreso genérica (XP, misiones, lugares del mapa).
// `fill` acepta cualquier background CSS para los casos con color propio
// (el degradado del lugar en la ficha del mapa).
export default function ProgressBar({ value, max, height = 10, fill = 'var(--grad-primary)', label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fillRef = useRef(null);
  const mounted = useRef(false);

  /* El ancho lo anima GSAP, no una `transition` de CSS: al montar crece desde
     cero (la barra se "llena" al entrar a la pantalla) y en los cambios
     posteriores interpola desde donde esté, aunque llegue otro cambio a mitad
     de camino. El `width` inline del JSX es el valor de reposo — si no hay JS
     o el usuario pidió menos movimiento, la barra igual se ve correcta. */
  useLayoutEffect(() => {
    const el = fillRef.current;
    if (!el) return undefined;

    const isFirst = !mounted.current;
    mounted.current = true;

    if (prefersReducedMotion()) {
      gsap.set(el, { width: `${pct}%` });
      return undefined;
    }

    const tween = isFirst
      ? gsap.fromTo(el, { width: 0 }, { width: `${pct}%`, duration: DUR.slow, ease: 'power2.out' })
      : gsap.to(el, { width: `${pct}%`, duration: DUR.base, ease: 'power2.out' });

    return () => tween.kill();
  }, [pct]);

  return (
    <div
      className={styles.track}
      style={{ height, borderRadius: height > 10 ? 7 : 6 }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div ref={fillRef} className={styles.fill} style={{ width: `${pct}%`, background: fill }} />
    </div>
  );
}
