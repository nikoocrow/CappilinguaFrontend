import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import Experience from './Experience.js';

// Prueba de post-procesado (pedida para acercarse a una atmósfera nocturna
// cálida tipo maqueta isométrica): bloom en las zonas más brillantes +
// viñeta + un ligero corrimiento de color cálido. Es un experimento
// desactivable, no el nuevo estándar visual -- arranca apagado y el jugador
// nunca paga su costo (un render extra por pase) salvo que se lo active
// a propósito desde el debug.
const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 1.1 },
    uWarmth: { value: 0.35 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uWarmth;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      vec2 centered = vUv - 0.5;
      float vignette = 1.0 - dot(centered, centered) * uVignette;
      color.rgb *= clamp(vignette, 0.0, 1.0);

      // Empuja rojo/amarillo, resta azul -- tinte cálido tipo luz de sodio.
      color.rgb += vec3(uWarmth * 0.08, uWarmth * 0.04, -uWarmth * 0.06);

      gl_FragColor = color;
    }
  `,
};

export default class Renderer {
  constructor() {
    this.experience = new Experience();
    this.canvas = this.experience.canvas;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.debug = this.experience.debug;

    // Desactivado por defecto (pedido explícito): es una prueba, no el modo
    // normal de juego.
    this.postEnabled = false;

    this.setInstance();
    this.setPostProcessing();

    if (this.debug.active) this.setDebug();
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

    // Reseteado a mano en update() en vez de automático: con post-procesado
    // activo, el composer llama a render() una vez por pase, y el autoReset
    // por defecto dejaría el contador de draw calls del debug overlay
    // mostrando solo los del ÚLTIMO pase en vez del total del frame.
    this.instance.info.autoReset = false;
  }

  setPostProcessing() {
    this.composer = new EffectComposer(this.instance);
    this.composer.addPass(new RenderPass(this.scene, this.camera.instance));

    // Bloom sobre las zonas más brillantes (ventanas iluminadas, reflejos
    // de sol) -- el umbral queda alto porque la escena hoy no tiene
    // materiales emissive tipo neón; con umbral bajo brillaría todo el
    // asfalto bajo el sol, no solo lo que debería "brillar".
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      0.4, // strength
      0.4, // radius
      0.75 // threshold
    );
    this.composer.addPass(this.bloomPass);

    this.gradePass = new ShaderPass(GRADE_SHADER);
    this.composer.addPass(this.gradePass);

    // OutputPass hace la conversión final de espacio de color/tone mapping
    // -- sin él, el EffectComposer entrega el frame sin la corrección que
    // renderer.render() aplica solo internamente en su último paso.
    this.composer.addPass(new OutputPass());
  }

  setDebug() {
    const folder = this.debug.ui.addFolder('Post-procesado');
    folder.add(this, 'postEnabled').name('Activar (prueba)');
    folder.add(this.bloomPass, 'strength').name('Bloom: intensidad').min(0).max(2).step(0.01);
    folder.add(this.bloomPass, 'radius').name('Bloom: radio').min(0).max(1).step(0.01);
    folder.add(this.bloomPass, 'threshold').name('Bloom: umbral').min(0).max(1).step(0.01);
    folder.add(this.gradePass.uniforms.uVignette, 'value').name('Viñeta').min(0).max(2).step(0.01);
    folder.add(this.gradePass.uniforms.uWarmth, 'value').name('Calidez').min(0).max(1).step(0.01);
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
    this.composer.setSize(this.sizes.width, this.sizes.height);
    this.composer.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    // autoReset está apagado (ver setInstance): resetear a mano acá, una
    // vez por frame, cubre los dos caminos (un solo render() abajo o los
    // varios que dispara composer.render() por sus pases).
    this.instance.info.reset();

    if (!this.postEnabled) {
      this.instance.render(this.scene, this.camera.instance);
      return;
    }

    this.composer.render();
  }

  // El composer trae sus propios render targets (bloom, ping-pong de
  // pases) que Experience.destroy() no alcanza con su traverse de escena
  // -- hay que soltarlos a mano, igual que el propio WebGLRenderer.
  destroy() {
    this.composer.dispose();
    this.instance.dispose();
  }
}
