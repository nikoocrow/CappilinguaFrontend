import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

/* Modo inmersivo: en las pantallas que son "el juego" (el mundo 3D de Inicio)
   el chrome de la app —barra superior, sidebar y los overlays del HUD— se
   oculta para que el canvas ocupe todo el área de contenido.

   Personalizar el avatar (`/avatar`) NO entra acá aunque también sea 3D: ahí
   la interfaz *es* la pantalla (el panel editorial de opciones), esconderla
   dejaría al usuario sin nada que tocar.

   La preferencia (`prefersImmersive`) se conserva entre navegaciones: si el
   usuario mostró la interfaz con la tecla "i" y va a Misiones, al volver a
   Inicio la sigue viendo. */

const IMMERSIVE_ROUTES = ['/inicio'];

const TOGGLE_KEY = 'i';

const ImmersiveContext = createContext(null);

// No robarle la tecla a un campo de texto (buscador de vocabulario, respuestas
// de la lección) ni a un atajo del navegador (⌘I, Ctrl+I).
function isTypingTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function ImmersiveProvider({ children }) {
  const { pathname } = useLocation();
  const [prefersImmersive, setPrefersImmersive] = useState(true);

  const canImmerse = IMMERSIVE_ROUTES.includes(pathname);
  const hidden = canImmerse && prefersImmersive;

  const toggle = useCallback(() => setPrefersImmersive((value) => !value), []);

  useEffect(() => {
    if (!canImmerse) return undefined;

    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== TOGGLE_KEY) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      toggle();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canImmerse, toggle]);

  const value = useMemo(
    () => ({ hidden, canImmerse, toggle, toggleKey: TOGGLE_KEY }),
    [hidden, canImmerse, toggle]
  );

  return <ImmersiveContext.Provider value={value}>{children}</ImmersiveContext.Provider>;
}

export function useImmersive() {
  const context = useContext(ImmersiveContext);
  if (!context) throw new Error('useImmersive debe usarse dentro de <ImmersiveProvider>');
  return context;
}
