/* Estado del jugador que sobrevive a la destrucción de la Experience.

   La pantalla del mundo es un componente de React: navegar a Avatar, Tienda o
   cualquier otra opción desmonta `GameCanvas` y destruye la Experience entera
   (regla 27), y al volver se construye una nueva desde cero. Sin esto el
   personaje reaparecía en el origen y con el zoom por defecto cada vez, como
   si el mundo se reiniciara por haber mirado otra pantalla.

   Vive en memoria del módulo y no en localStorage a propósito: es estado de
   la sesión de juego, no una preferencia del usuario como `characterConfig`.
   Recargar la página empieza de nuevo, que es lo que se espera de un reload. */

const state = {
  x: 0,
  z: 0,
  rotationY: 0,
  zoom: 1,
};

// Se devuelve el objeto real en vez de una copia: se lee una sola vez al
// construir el mundo y así no hay allocation de por medio.
export function getPlayerState() {
  return state;
}

export function savePlayerState({ position, rotationY, zoom }) {
  state.x = position.x;
  state.z = position.z;
  state.rotationY = rotationY;
  state.zoom = zoom;
}
