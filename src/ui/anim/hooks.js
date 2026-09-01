import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, DUR, prefersReducedMotion } from './gsap.js';

/* Hooks de animación. Todos siguen la misma regla de convivencia con React:
   la animación se crea dentro de un `gsap.context` acotado a un ref y el
   cleanup hace `revert()`, que mata los tweens y borra los estilos inline que
   GSAP haya escrito. Sin eso, desmontar una pantalla a mitad de su entrada
   dejaría nodos con `opacity:0` pegado. */

// `useLayoutEffect` y no `useEffect`: el estado inicial (opacity 0) tiene que
// quedar aplicado antes de que el navegador pinte, o se ve un flash del
// contenido ya ubicado.
export function useGsapScope(setup, deps = []) {
  const scope = useRef(null);

  useLayoutEffect(() => {
    if (!scope.current) return undefined;
    const ctx = gsap.context(setup, scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

/* Entrada de una pantalla. En vez de recibir selectores de CSS Modules (que
   son nombres hasheados), lee atributos `data-anim` del marcado:

     data-anim="head"  → encabezado, entra primero
     data-anim="item"  → filas/tarjetas, entran escalonadas

   Así el marcado declara qué se anima y la pantalla no importa nada de GSAP. */
export function useScreenEnter({ stagger = 0.05, maxStagger = 0.5, replayKey = null } = {}) {
  const isFirstRun = useRef(true);

  return useGsapScope(
    (self) => {
      if (prefersReducedMotion()) return;

      // El encabezado entra una sola vez. `replayKey` (la pestaña activa, el
      // filtro) vuelve a animar solo la lista: repetir el título en cada
      // cambio de pestaña se siente nervioso, no fluido.
      const first = isFirstRun.current;
      isFirstRun.current = false;

      if (first) {
        gsap.from('[data-anim="head"]', {
          y: 16,
          opacity: 0,
          duration: DUR.base,
          stagger: 0.06,
          clearProps: 'opacity,transform',
        });
      }

      const items = self.selector('[data-anim="item"]');
      if (items.length === 0) return;

      gsap.from(items, {
        y: 20,
        opacity: 0,
        duration: DUR.base,
        delay: first ? 0.08 : 0,
        // `amount` reparte un total fijo en vez de sumar por elemento: 17
        // tarjetas de la tienda a 0.05 s cada una tardarían casi un segundo
        // en terminar de entrar.
        stagger: { amount: Math.min(items.length * stagger, maxStagger) },
        clearProps: 'opacity,transform',
      });
    },
    [replayKey]
  );
}

/* Número que se interpola cuando cambia (saldos de la barra superior).

   Escribe en `textContent` con un ref en vez de pasar por estado de React:
   un `setState` por frame durante medio segundo son ~30 renders del árbol
   completo (misma razón por la que el loop 3D tampoco toca el estado). */
export function useTweenedNumber(value, format = (n) => String(n)) {
  const ref = useRef(null);
  const previous = useRef(value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const from = previous.current;
    previous.current = value;

    if (from === value || prefersReducedMotion()) {
      el.textContent = format(value);
      return undefined;
    }

    const counter = { n: from };
    const tween = gsap.to(counter, {
      n: value,
      duration: DUR.slow,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = format(Math.round(counter.n));
      },
    });

    return () => tween.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return ref;
}

/* Overlay que aparece (toast, tarjetas flotantes). Devuelve el ref del nodo.
   `delay` sirve para encadenar: el botón de interfaz espera a que el chrome
   termine de fundirse antes de aparecer, en vez de cruzarse con él. */
export function usePopIn({ y = 14, scale = 0.96, duration = DUR.fast, delay = 0 } = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    const tween = gsap.from(el, {
      y,
      scale,
      opacity: 0,
      duration,
      delay,
      ease: 'back.out(1.6)',
      clearProps: 'opacity,transform',
    });

    return () => tween.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/* Chrome que entra y sale con fundido pero que se desmonta de verdad al
   terminar. Existe porque la regla 31 no admite `display:none`: si el chrome
   se quedara en el árbol con `opacity:0`, el área de contenido no crecería y
   el ResizeObserver de Sizes nunca redimensionaría el canvas.

   Tres fases:
     'in'      → montado y visible
     'leaving' → todavía montado, corriendo el fundido de salida
     'out'     → desmontado

   Cada nodo declara con un atributo de dónde entra y hacia dónde sale
   (`data-chrome="top"`, `data-hud="bottom"`, …). El nombre del atributo es
   parámetro y no fijo porque los scopes se anidan —el shell contiene a las
   pantallas— y `querySelectorAll` de arriba capturaría los nodos de abajo.

   Quien lo usa se encarga de sacar el chrome del flujo mientras `leaving`
   esté activo: así el layout (y con él el tamaño del canvas) cambia una sola
   vez, al principio del gesto, y el fundido corre por encima del juego en vez
   de a mitad de un reflow. */
const REVEAL_OFFSET = {
  top: { y: -14 },
  bottom: { y: 14 },
  left: { x: -22 },
  right: { x: 22 },
  fade: {},
};

export function useReveal(visible, { attr = 'data-reveal', stagger = 0.04 } = {}) {
  const scope = useRef(null);
  const [phase, setPhase] = useState(visible ? 'in' : 'out');
  const leaving = phase === 'leaving';

  useLayoutEffect(() => {
    // Mostrar es inmediato; ocultar pasa primero por 'leaving', que es lo que
    // le da tiempo al fundido antes del desmontaje.
    setPhase((current) => {
      if (visible) return 'in';
      return current === 'out' ? 'out' : 'leaving';
    });
  }, [visible]);

  useLayoutEffect(() => {
    const root = scope.current;
    if (!root || phase === 'out') return undefined;

    const nodes = root.querySelectorAll(`[${attr}]`);

    if (nodes.length === 0 || prefersReducedMotion()) {
      if (leaving) setPhase('out');
      return undefined;
    }

    // Valores por nodo: GSAP acepta funciones y las resuelve por elemento.
    const offset = (axis) => (index, el) => REVEAL_OFFSET[el.getAttribute(attr)]?.[axis] ?? 0;

    const ctx = gsap.context(() => {
      const vars = {
        opacity: 0,
        x: offset('x'),
        y: offset('y'),
        duration: DUR.fast,
        stagger,
      };

      if (leaving) {
        // El desmontaje lo dispara el propio tween: sin esto el nodo se iría
        // antes de terminar de fundirse.
        gsap.to(nodes, { ...vars, ease: 'power2.in', onComplete: () => setPhase('out') });
      } else {
        gsap.from(nodes, { ...vars, ease: 'power2.out', clearProps: 'opacity,transform' });
      }
    }, scope);

    return () => ctx.revert();
  }, [phase, attr, stagger]);

  return { scope, mounted: phase !== 'out', leaving };
}
