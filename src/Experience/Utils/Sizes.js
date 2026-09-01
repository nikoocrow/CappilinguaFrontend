import EventEmitter from './EventEmitter.js';

// Cap pixelRatio a 2: en pantallas 3x+ un valor sin cap triplica el costo de
// fragment shader sin ganancia visual perceptible.
const MAX_PIXEL_RATIO = 2;

// Mide la ventana completa o, si se le pasa un elemento, ese elemento. El
// caso "elemento" existe porque el canvas ya no ocupa toda la pantalla: vive
// dentro del área de contenido del shell de React (barra superior + sidebar),
// que puede cambiar de tamaño sin que la ventana lo haga. Por eso ahí se usa
// ResizeObserver en vez del evento 'resize' de window, que no lo vería.
export default class Sizes extends EventEmitter {
  constructor(element = null) {
    super();

    this.element = element;
    this._measure();

    if (element) {
      this._observer = new ResizeObserver(() => {
        this._measure();
        this.trigger('resize');
      });
      this._observer.observe(element);
    } else {
      this._onWindowResize = () => {
        this._measure();
        this.trigger('resize');
      };
      window.addEventListener('resize', this._onWindowResize);
    }
  }

  _measure() {
    if (this.element) {
      const rect = this.element.getBoundingClientRect();
      // Un contenedor todavía sin layout mide 0: clampear evita dividir por
      // cero al calcular el aspect de la cámara.
      this.width = Math.max(rect.width, 1);
      this.height = Math.max(rect.height, 1);
    } else {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    }

    this.pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
  }

  destroy() {
    if (this._observer) this._observer.disconnect();
    if (this._onWindowResize) window.removeEventListener('resize', this._onWindowResize);
    this.off('resize');
  }
}
