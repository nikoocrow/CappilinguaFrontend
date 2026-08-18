import GUI from 'lil-gui';

// Panel de ajuste en vivo (luces, sombras) para afinar calidad-vs-costo sin
// tocar código. Solo se instancia si se navega con #debug en la URL.
export default class Debug {
  constructor() {
    this.active = window.location.hash === '#debug';

    if (this.active) {
      this.ui = new GUI();
    }
  }
}
