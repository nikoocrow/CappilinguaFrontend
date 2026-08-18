import EventEmitter from './EventEmitter.js';

// Cap pixelRatio a 2: en pantallas 3x+ un valor sin cap triplica el costo de
// fragment shader sin ganancia visual perceptible.
const MAX_PIXEL_RATIO = 2;

export default class Sizes extends EventEmitter {
  constructor() {
    super();

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);

    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);

      this.trigger('resize');
    });
  }
}
