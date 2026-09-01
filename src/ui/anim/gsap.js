import gsap from 'gsap';

/* Configuración única de GSAP para toda la UI de React.

   Por qué GSAP y no más CSS: las transiciones de CSS no encadenan ni
   escalonan (stagger) y no saben interpolar un número que se muestra como
   texto. GSAP hace las dos cosas con un solo ticker.

   Dónde manda cada uno (importante para no pelearse por la misma propiedad):
   - **GSAP**: entradas de pantalla, cambios de valor (saldos, barras) y
     aparición/salida de overlays. Todo lo que tiene duración y orden.
   - **CSS**: hover, focus y press de botones y tarjetas. Son estados, no
     secuencias, y ya están resueltos con `transition` en los .module.css.
   Ninguna propiedad debería estar animada por los dos a la vez. */

export const DUR = {
  fast: 0.28,
  base: 0.45,
  slow: 0.6,
};

export const EASE = 'power3.out';

gsap.defaults({ ease: EASE, duration: DUR.base });

// Un frame perdido no debe hacer saltar la animación entera (mismo espíritu
// que el clamp de delta de Time.js en el motor 3D).
gsap.ticker.lagSmoothing(500, 33);

/* Respeto de `prefers-reduced-motion`: se consulta en cada animación en vez
   de cachearlo, porque el usuario puede cambiar el ajuste del sistema con la
   app abierta. Cuando está activo no se anima: se salta al estado final. */
export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export { gsap };
