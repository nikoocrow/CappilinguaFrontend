import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Sizes from '../Experience/Utils/Sizes.js';
import Time from '../Experience/Utils/Time.js';
import Debug from '../Experience/Utils/Debug.js';
import Resources from '../Experience/Utils/Resources.js';
import { CHARACTER_MODEL_SOURCE, IDLE_ANIMATION_SOURCE } from '../Experience/World/characterConfig.js';
import CharacterStage from './CharacterStage.js';
import { CustomizeUI } from './CustomizeUI.js';

const FRUSTUM_SIZE = 3.6; // vertical, en unidades de mundo — encuadra un personaje de pie de cerca
const LOOK_TARGET_Y = 1; // altura de pecho: centro de órbita de la cámara

let instance = null;

// Orquestador mínimo para la pantalla de personalización: mismo patrón que
// Experience.js (singleton, un solo loop colgado de Time#tick) pero sin el
// mundo/streaming/NPCs del juego — acá solo hay un personaje en un pedestal.
export default class CustomizeExperience {
  constructor(canvas) {
    if (instance) {
      return instance;
    }
    instance = this;

    window.customizeExperience = this;

    this.canvas = canvas;

    this.debug = new Debug();
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1d24);
    this.resources = new Resources([CHARACTER_MODEL_SOURCE, IDLE_ANIMATION_SOURCE]);

    // El panel de personalización va en DOM (regla 10) al costado del canvas,
    // no encima: primero se monta el panel, así el canvas/cámara se dimensionan
    // ya descontando el espacio que ocupa (ver _viewportSize()).
    this.stage = new CharacterStage();
    this.ui = new CustomizeUI(this.stage);

    this.setCamera();
    this.setLights();
    this.setPedestal();
    this.setRenderer();
    this.setControls();

    this.sizes.on('resize', () => this.resize());
    this.time.on('tick', () => this.update());
  }

  // Descuenta del viewport el espacio que ocupa el panel DOM, sea que esté
  // al costado (pantallas anchas) o abajo (pantallas angostas, ver media
  // query en style.css) — así el personaje queda centrado en el área visible
  // en vez de quedar tapado detrás del panel.
  _viewportSize() {
    const panelRect = this.ui.panel.getBoundingClientRect();
    const isSidePanel = panelRect.height >= this.sizes.height - 1;

    return isSidePanel
      ? { width: Math.max(this.sizes.width - panelRect.width, 200), height: this.sizes.height }
      : { width: this.sizes.width, height: Math.max(this.sizes.height - panelRect.height, 200) };
  }

  setCamera() {
    const { width, height } = this._viewportSize();
    const aspect = width / height;
    this.camera = new THREE.OrthographicCamera(
      (-FRUSTUM_SIZE * aspect) / 2,
      (FRUSTUM_SIZE * aspect) / 2,
      FRUSTUM_SIZE / 2,
      -FRUSTUM_SIZE / 2,
      0.1,
      100
    );

    // Ángulo isométrico como en el juego, pero acercado y apuntando a la
    // altura del pecho para que el personaje quede centrado en cuadro.
    const d = 5;
    this.camera.position.set(d, d * Math.tan(THREE.MathUtils.degToRad(35.264)) * Math.SQRT2 + 1, d);
    this.camera.lookAt(0, LOOK_TARGET_Y, 0);
    this.scene.add(this.camera);
  }

  // Excepción a la regla de "raycasting/input solo event-driven": OrbitControls
  // es el propio mecanismo estándar de three.js para orbitar con mouse/touch,
  // no un raycast nuestro por frame. Solo activo en esta pantalla (nunca en el
  // juego, que mantiene su cámara isométrica fija sin rotación).
  setControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, LOOK_TARGET_Y, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minZoom = 0.6;
    this.controls.maxZoom = 2.5;
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(20);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(85);
    this.controls.update();
  }

  setLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    this.sunLight = new THREE.DirectionalLight(0xffffff, 3);
    this.sunLight.position.set(3, 5, 4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.camera.left = -2;
    this.sunLight.shadow.camera.right = 2;
    this.sunLight.shadow.camera.top = 3;
    this.sunLight.shadow.camera.bottom = -2;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
  }

  setPedestal() {
    const geometry = new THREE.CylinderGeometry(1.1, 1.1, 0.15, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x232730, roughness: 0.9 });
    this.pedestal = new THREE.Mesh(geometry, material);
    this.pedestal.position.y = -0.075;
    this.pedestal.receiveShadow = true;
    this.scene.add(this.pedestal);
  }

  setRenderer() {
    const { width, height } = this._viewportSize();
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  resize() {
    const { width, height } = this._viewportSize();
    const aspect = width / height;
    this.camera.left = (-FRUSTUM_SIZE * aspect) / 2;
    this.camera.right = (FRUSTUM_SIZE * aspect) / 2;
    this.camera.top = FRUSTUM_SIZE / 2;
    this.camera.bottom = -FRUSTUM_SIZE / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    this.stage.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
