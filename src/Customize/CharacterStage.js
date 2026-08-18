import * as THREE from 'three';
import CustomizeExperience from './CustomizeExperience.js';
import {
  BODY_MESH_NAME,
  loadCharacterConfig,
  saveCharacterConfig,
  visibleMeshNamesFor,
} from '../Experience/World/characterConfig.js';

const MODEL_SCALE = 1.56;
const ROTATE_SPEED = 0.12; // rad/s — turntable lento y automático, sin input por frame

// Personaje en el pedestal de la pantalla de personalización: solo idle,
// sin movimiento/target como Player.js. Expone setSlotOption/setSkinColor
// para que CustomizeUI aplique cambios en vivo y los persista.
export default class CharacterStage {
  constructor() {
    this.experience = new CustomizeExperience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.time = this.experience.time;

    this.config = loadCharacterConfig();

    this._meshByName = new Map();
    this._bodyMaterial = null;
    this.mixer = null;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.resources.on('ready', () => this._build());
  }

  _build() {
    this.model = this.resources.items.characterModel.scene;
    this.model.scale.setScalar(MODEL_SCALE);

    this.model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;

      this._meshByName.set(child.name, child);
      if (child.name === BODY_MESH_NAME) {
        child.material = child.material.clone();
        this._bodyMaterial = child.material;
      }
    });
    this.group.add(this.model);

    this.mixer = new THREE.AnimationMixer(this.model);
    this.action = this.mixer.clipAction(this.resources.items.idleAnimation.animations[0]);
    this.action.play();

    this._applyVisibility();
    this._applySkin();
  }

  _applyVisibility() {
    const visible = visibleMeshNamesFor(this.config.selection);
    visible.add(BODY_MESH_NAME);
    for (const [name, mesh] of this._meshByName) {
      mesh.visible = visible.has(name);
    }
  }

  _applySkin() {
    if (!this._bodyMaterial) return;
    this._bodyMaterial.color.set(this.config.skinColor);
  }

  setSlotOption(slotKey, meshName) {
    this.config.selection[slotKey] = meshName;
    this._applyVisibility();
    saveCharacterConfig(this.config);
  }

  setSkinColor(hex) {
    this.config.skinColor = hex;
    this._applySkin();
    saveCharacterConfig(this.config);
  }

  // Confirmación explícita al terminar de personalizar (botón "Guardar" en
  // CustomizeUI). Cada cambio de slot/piel ya persiste al toque, así que
  // esto es un guardado defensivo antes de mandar al jugador al mundo.
  save() {
    saveCharacterConfig(this.config);
  }

  update() {
    if (!this.mixer) return;
    const dt = this.time.delta;
    this.mixer.update(dt);
    this.group.rotation.y += ROTATE_SPEED * dt;
  }
}
