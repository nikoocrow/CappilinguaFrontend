import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import Experience from './Experience.js';

// Arranca en 0 (regla 12: nada de debug activo en el flujo normal) — se
// sube desde el panel de debug para comparar el costo de draw calls del
// composer contra el renderer.render() directo (ver Debug.js: el panel de
// stats ya muestra draw calls/FPS en vivo).
const BLOOM_STRENGTH_DEFAULT = 1.2;

export default class Renderer {
  constructor() {
    this.experience = new Experience();
    this.canvas = this.experience.canvas;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.debug = this.experience.debug;

    this.setInstance();

    if (this.debug.active) this.setPostProcessing();
  }

  setInstance() {
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      stencil: false, // no se usa stencil: ahorra memoria del framebuffer
      powerPreference: 'high-performance',
    });

    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);

    // Ver comentario en update(): sin esto, info.render.calls se resetea en
    // cada render() interno del composer y el panel de stats solo cuenta el
    // último pase.
    this.instance.info.autoReset = false;
  }

  // Solo se arma con #debug en la URL (regla 12) — un EffectComposer reserva
  // render targets propios que nadie más necesita en el flujo normal del
  // juego. Bloom apagado por defecto ("Bloom activo" en el panel): la idea
  // es medir en el panel de stats cuánto suman los draw calls del composer
  // al prenderlo, no dejarlo puesto en el juego real.
  setPostProcessing() {
    this.composer = new EffectComposer(this.instance);
    this.composer.addPass(new RenderPass(this.scene, this.camera.instance));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      0, // strength: apagado hasta que se active desde el debug
      0.4, // radius
      0.85 // threshold: solo lo más brillante (sol, especulares) brilla
    );
    this.composer.addPass(this.bloomPass);

    this.bloomEnabled = false;
    this._bloomStrength = BLOOM_STRENGTH_DEFAULT;

    const folder = this.debug.ui.addFolder('Post-procesado');
    folder
      .add(this, 'bloomEnabled')
      .name('Bloom activo')
      .onChange((enabled) => {
        this.bloomPass.strength = enabled ? this._bloomStrength : 0;
      });
    folder
      .add(this, '_bloomStrength', 0, 3, 0.05)
      .name('Intensidad glow')
      .onChange((value) => {
        if (this.bloomEnabled) this.bloomPass.strength = value;
      });
    folder.add(this.bloomPass, 'radius', 0, 1, 0.01).name('Radio glow');
    folder.add(this.bloomPass, 'threshold', 0, 1, 0.01).name('Umbral glow');
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
    this.composer?.setSize(this.sizes.width, this.sizes.height);
  }

  update() {
    // Reset manual una vez por frame (autoReset = false, ver setInstance):
    // así el conteo acumula todos los render() internos del composer en vez
    // de solo el último pase.
    this.instance.info.reset();

    // Fuera de debug (o con el bloom apagado) se sigue usando
    // renderer.render() directo — el composer solo entra en el camino
    // caliente cuando realmente se está midiendo su costo.
    if (this.bloomEnabled) {
      this.composer.render();
    } else {
      this.instance.render(this.scene, this.camera.instance);
    }
  }
}
