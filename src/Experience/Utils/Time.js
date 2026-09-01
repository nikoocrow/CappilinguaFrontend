import EventEmitter from './EventEmitter.js';

// Delta en segundos (no ms) y clamp a 50ms: si la pestaña estuvo inactiva o
// hubo un frame largo, evita que el jugador/animaciones salten de golpe.
const MAX_DELTA = 0.05;

export default class Time extends EventEmitter {
  constructor() {
    super();

    this.start = performance.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 1 / 60;
    this._stopped = false;

    this._raf = window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  tick() {
    const currentTime = performance.now();
    this.delta = Math.min((currentTime - this.current) / 1000, MAX_DELTA);
    this.current = currentTime;
    this.elapsed = (this.current - this.start) / 1000;

    this.trigger('tick');

    if (this._stopped) return;

    this._raf = window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  // El loop ya no vive lo que vive la pestaña: al salir de la pantalla del
  // mapa/avatar React desmonta la Experience y hay que cortar el rAF, o
  // seguiría renderizando (y acumulando loops al volver a entrar).
  stop() {
    this._stopped = true;
    window.cancelAnimationFrame(this._raf);
    this.off('tick');
  }
}
