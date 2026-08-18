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

    window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  tick() {
    const currentTime = performance.now();
    this.delta = Math.min((currentTime - this.current) / 1000, MAX_DELTA);
    this.current = currentTime;
    this.elapsed = (this.current - this.start) / 1000;

    this.trigger('tick');

    window.requestAnimationFrame(() => {
      this.tick();
    });
  }
}
