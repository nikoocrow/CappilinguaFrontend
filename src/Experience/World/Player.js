import * as THREE from 'three';
import Experience from '../Experience.js';
import { BODY_MESH_NAME, MODEL_SCALE, loadCharacterConfig, visibleMeshNamesFor } from './characterConfig.js';
import { getPlayerState } from './playerState.js';

const SPEED = 4.8; // unidades por segundo (-40% para acompasar con la animación)
const RUN_SPEED = SPEED * 2;
const TURN_SPEED = 10; // rapidez de giro
const REST_HEIGHT = 0;
const ANIM_FADE = 0.25; // duración del cross-fade entre animaciones
// Radio de colisión del jugador contra los AABB de Street.js: se suma al
// rectángulo de cada objeto, así el chequeo sigue siendo una comparación de
// números por collider (regla 9), sin acercarse más de este margen a nada.
const COLLISION_RADIUS = 0.35;
// Desplazamiento mínimo por frame para contar como "se movió de verdad".
// Si el target cae dentro de un objeto, el eje libre converge asintóticamente
// hacia su propia componente del target sin llegar nunca a 0 exacto: cada
// frame technically desplaza una fracción de milímetro, así que comparar
// contra 0 nunca detecta que está trabado (ver historial de este archivo).
const MIN_MOVE_SQ = 0.01 * 0.01;

export default class Player {
  // `colliders` son los AABB planos (XZ) de Street.js — objetos estáticos
  // con los que no se puede caminar encima (ver Street.js#_buildColliders).
  constructor({ colliders = [] } = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.resources = this.experience.resources;
    this.colliders = colliders;

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
    const wantsToMove = dist > 0.05;

    let moved = false;
    if (wantsToMove) {
      this._dir.normalize();

      // Girar suavemente hacia la dirección de movimiento
      const targetAngle = Math.atan2(this._dir.x, this._dir.z);
      let delta = targetAngle - this.group.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.group.rotation.y += delta * Math.min(1, TURN_SPEED * dt);

      const speed = this._running ? RUN_SPEED : SPEED;
      const step = Math.min(speed * dt, dist);
      moved = this._moveWithCollisions(step);
    }

    // El estado de animación sigue el movimiento real, no las ganas de
    // moverse: si un collider lo frena en seco (ambos ejes bloqueados, ver
    // _moveWithCollisions), se queda en idle en vez de "correr" clavado
    // contra la pared.
    this._moving = moved;
    this._setState(!this._moving ? 'idle' : this._running ? 'run' : 'walk');

    this.mixer.update(dt);
  }

  // Resuelve cada eje por separado ("separate axis sweep"): mueve en X si
  // no choca, y recién con esa X ya aplicada intenta Z — permite bordear
  // paredes deslizando sin la rama "diagonal completa vs. un solo eje" de
  // antes, que podía reportar movimiento sin desplazar nada (ver historial).
  _moveWithCollisions(step) {
    const startX = this.group.position.x;
    const startZ = this.group.position.z;
    const dx = this._dir.x * step;
    const dz = this._dir.z * step;

    // Si ya está parado sobre un collider (posición restaurada de antes de
    // que existiera, por ejemplo), no bloquear el movimiento: se quedaría
    // trabado ahí para siempre. El bloqueo solo aplica al entrar limpio.
    if (this._collidesAt(startX, startZ)) {
      this.group.position.x = startX + dx;
      this.group.position.z = startZ + dz;
    } else {
      if (dx !== 0 && !this._collidesAt(startX + dx, startZ)) {
        this.group.position.x = startX + dx;
      }
      if (dz !== 0 && !this._collidesAt(this.group.position.x, startZ + dz)) {
        this.group.position.z = startZ + dz;
      }
    }

    // Umbral mínimo, no comparación contra 0: si el target cae dentro de un
    // objeto, el eje libre converge asintóticamente hacia su propia
    // componente del target sin tocar nunca el otro eje (bloqueado) — cada
    // frame technically desplaza, pero una fracción de milímetro cada vez
    // más chica. Sin este umbral, "moved" da true para siempre y el
    // personaje queda animando caminar clavado en el lugar (ver historial).
    const movedX = this.group.position.x - startX;
    const movedZ = this.group.position.z - startZ;
    return movedX * movedX + movedZ * movedZ > MIN_MOVE_SQ;
  }

  _collidesAt(x, z) {
    for (const c of this.colliders) {
      if (
        x > c.minX - COLLISION_RADIUS &&
        x < c.maxX + COLLISION_RADIUS &&
        z > c.minZ - COLLISION_RADIUS &&
        z < c.maxZ + COLLISION_RADIUS
      ) {
        return true;
      }
    }
    return false;
  }
}
