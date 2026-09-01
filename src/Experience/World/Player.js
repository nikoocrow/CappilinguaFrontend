import * as THREE from 'three';
import Experience from '../Experience.js';
import { BODY_MESH_NAME, MODEL_SCALE, loadCharacterConfig, visibleMeshNamesFor } from './characterConfig.js';
import { getPlayerState } from './playerState.js';

const SPEED = 4.8; // unidades por segundo (-40% para acompasar con la animación)
const RUN_SPEED = SPEED * 2;
const TURN_SPEED = 10; // rapidez de giro
const REST_HEIGHT = 0;
const ANIM_FADE = 0.25; // duración del cross-fade entre animaciones

export default class Player {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.resources = this.experience.resources;

    // Dónde quedó el personaje la última vez que existió esta escena. En un
    // arranque limpio es el origen; al volver de otra pantalla, el punto en
    // el que se lo dejó (playerState.js).
    const saved = getPlayerState();

    this.group = new THREE.Group();
    this.group.position.set(saved.x, REST_HEIGHT, saved.z);
    this.group.rotation.y = saved.rotationY;
    this.scene.add(this.group);

    // El destino arranca siendo la posición actual: se restaura dónde está
    // parado, no hacia dónde iba. Volver a la pantalla y verlo seguir
    // caminando solo sería más raro que verlo quieto.
    this.target = this.group.position.clone();
    this._dir = new THREE.Vector3();

    this.mixer = null;
    this.actions = null;
    this.currentAction = null;
    this._moving = false;
    this._running = false;
    this._state = 'idle';

    this.setModel();
    this.setAnimation();
  }

  get position() {
    return this.group.position;
  }

  setModel() {
    this.model = this.resources.items.characterModel.scene;
    this.model.scale.setScalar(MODEL_SCALE);

    // Outfit y color de piel elegidos en la pantalla de personalización
    // (customize.html), persistidos en localStorage. Ver characterConfig.js.
    const config = loadCharacterConfig();
    const visibleMeshes = visibleMeshNamesFor(config.selection);
    visibleMeshes.add(BODY_MESH_NAME);

    this.model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.visible = visibleMeshes.has(child.name);

      if (child.name === BODY_MESH_NAME) {
        child.material = child.material.clone();
        child.material.color.set(config.skinColor);
      }
    });
    this.group.add(this.model);
  }

  setAnimation() {
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {
      idle: this.mixer.clipAction(this.resources.items.idleAnimation.animations[0]),
      walk: this.mixer.clipAction(this.resources.items.walkAnimation.animations[0]),
      run: this.mixer.clipAction(this.resources.items.runAnimation.animations[0]),
    };
    this.currentAction = this.actions[this._state];
    this.currentAction.play();
  }

  setTarget(x, z, running = false) {
    this.target.set(x, this.group.position.y, z);
    this._running = running;
  }

  _setState(state) {
    if (state === this._state) return;
    this._state = state;

    const next = this.actions[state];
    next.reset().play();
    this.currentAction.crossFadeTo(next, ANIM_FADE, true);
    this.currentAction = next;
  }

  update() {
    const dt = this.time.delta;

    this._dir.subVectors(this.target, this.group.position);
    const dist = this._dir.length();
    this._moving = dist > 0.05;
    this._setState(!this._moving ? 'idle' : this._running ? 'run' : 'walk');

    if (this._moving) {
      this._dir.normalize();

      // Girar suavemente hacia la dirección de movimiento
      const targetAngle = Math.atan2(this._dir.x, this._dir.z);
      let delta = targetAngle - this.group.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.group.rotation.y += delta * Math.min(1, TURN_SPEED * dt);

      const speed = this._running ? RUN_SPEED : SPEED;
      const step = Math.min(speed * dt, dist);
      this.group.position.addScaledVector(this._dir, step);
    }

    this.mixer.update(dt);
  }
}
