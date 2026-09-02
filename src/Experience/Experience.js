import * as THREE from 'three';
import Sizes from './Utils/Sizes.js';
import Time from './Utils/Time.js';
import Debug from './Utils/Debug.js';
import Resources from './Utils/Resources.js';
import sources from './Sources.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import World from './World/World.js';

let instance = null;

export default class Experience {
  // `container` es el elemento que define el tamaño del canvas. Se pasa desde
  // el shell de React (el área de contenido, que no es la ventana entera);
  // sin él, Sizes mide la ventana como antes.
  constructor(canvas, container = null) {
    if (instance) {
      return instance;
    }
    instance = this;

    window.experience = this;

    this.canvas = canvas;
    // Lo usa la UI en DOM (DialogUI) para flotar sobre el área de juego
    // en vez de sobre la ventana entera.
    this.container = container;

    this.debug = new Debug();
    this.sizes = new Sizes(container);
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1d24);
    this.resources = new Resources(sources);
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.world = new World();

    this.sizes.on('resize', () => {
      this.resize();
    });

    this.time.on('tick', () => {
      this.update();
    });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update(this.time.delta);
    this.world.update();
    this.renderer.update();

    if (this.debug.active) this.debug.updateStats(this.renderer.instance.info.render);
  }

  destroy() {
    this.sizes.off('resize');
    this.time.off('tick');

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        for (const key in child.material) {
          const value = child.material[key];
          if (value && typeof value.dispose === 'function') {
            value.dispose();
          }
        }
      }
    });

    this.renderer.destroy();

    this.world.destroy();

    this.debug.destroy();

    this.time.stop();
    this.sizes.destroy();

    // Soltar el singleton: si no, volver a entrar a la pantalla del mapa
    // devolvería esta misma Experience ya destruida en vez de crear una nueva.
    instance = null;
    window.experience = null;
  }
}
