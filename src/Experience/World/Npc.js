import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import Experience from '../Experience.js';
import { BODY_MESH_NAME, MODEL_SCALE, randomCharacterConfig, visibleMeshNamesFor } from './characterConfig.js';

const FACE_RADIUS = 5; // distancia a la que empieza a mirar al jugador
const TURN_SPEED = 5;
const BUBBLE_HEIGHT = 3.57; // por encima de la cabeza del modelo (≈2.2 con MODEL_SCALE)

function makeBubbleTexture() {
  // Globo de "!" dibujado en un canvas para no depender de imágenes externas
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#eceff4';
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#bf616a';
  ctx.font = 'bold 76px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 64, 68);

  return new THREE.CanvasTexture(canvas);
}

// Textura y material del globo compartidos a nivel de módulo (regla 3): todos
// los NPCs muestran el mismo "!", solo cambia la posición de cada sprite.
const bubbleMaterial = new THREE.SpriteMaterial({ map: makeBubbleTexture(), transparent: true });

export default class Npc {
  constructor({ x = 6, z = -4, name = 'NPC', dialog = null, config = null } = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.resources = this.experience.resources;

    this.name = name;
    this.dialog = dialog;
    this.config = config;
    this.interactRadius = 2.2;

    this.group = new THREE.Group();

    this.setModel();
    this.setAnimation();

    this.bubble = new THREE.Sprite(bubbleMaterial);
    this.bubble.scale.set(0.8, 0.8, 1);
    this.bubble.position.y = BUBBLE_HEIGHT;
    this.group.add(this.bubble);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);

    this._time = Math.random() * Math.PI * 2;
  }

  setModel() {
    // Mismo personaje que el jugador, con outfit aleatorio. Clone con
    // SkeletonUtils porque las mallas son skinneadas (comparte geometría y
    // materiales con el original; solo se clona el material del cuerpo para
    // tintar la piel por instancia).
    this.model = cloneSkeleton(this.resources.items.characterModel.scene);
    this.model.scale.setScalar(MODEL_SCALE);

    // El outfit puede venir precalculado (spawns por chunk, ver npcSpawns.js)
    // o generarse al vuelo si el NPC se crea suelto.
    const config = this.config ?? randomCharacterConfig();
    const visibleMeshes = visibleMeshNamesFor(config.selection);
    visibleMeshes.add(BODY_MESH_NAME);

    this.model.traverse((child) => {
      if (!child.isMesh) return;
      child.visible = visibleMeshes.has(child.name);
      if (!child.visible) return;

      child.castShadow = true;
      child.receiveShadow = true;

      if (child.name === BODY_MESH_NAME) {
        child.material = child.material.clone();
        child.material.color.set(config.skinColor);
        this._bodyMaterial = child.material; // clone por instancia, se dispone en destroy()
      }
    });
    this.group.add(this.model);
  }

  setAnimation() {
    this.mixer = new THREE.AnimationMixer(this.model);
    const idle = this.mixer.clipAction(this.resources.items.idleAnimation.animations[0]);
    // Arrancar en un punto aleatorio del clip para que varios NPCs no queden
    // respirando en sincronía perfecta.
    idle.time = Math.random() * idle.getClip().duration;
    idle.play();
  }

  get position() {
    return this.group.position;
  }

  // Punto de llegada: a interactRadius del NPC, en línea hacia el jugador
  approachPoint(fromPosition) {
    const dir = new THREE.Vector3().subVectors(fromPosition, this.group.position);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
    dir.normalize().multiplyScalar(this.interactRadius * 0.8);
    return new THREE.Vector3().addVectors(this.group.position, dir);
  }

  isNear(position) {
    const dx = position.x - this.group.position.x;
    const dz = position.z - this.group.position.z;
    return Math.hypot(dx, dz) <= this.interactRadius;
  }

  update(playerPosition) {
    const dt = this.time.delta;

    this.mixer.update(dt);

    // El globo flota suavemente
    this._time += dt;
    this.bubble.position.y = BUBBLE_HEIGHT + Math.sin(this._time * 2.5) * 0.12;

    // Mirar al jugador cuando está cerca
    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    if (Math.hypot(dx, dz) < FACE_RADIUS) {
      const targetAngle = Math.atan2(dx, dz);
      let delta = targetAngle - this.group.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.group.rotation.y += delta * Math.min(1, TURN_SPEED * dt);
    }
  }

  // Dispose por chunk (regla 22 del system design): al despawnear se libera
  // solo lo propio de esta instancia — el material clonado del cuerpo. La
  // geometría, el resto de materiales y el globo son compartidos a nivel de
  // módulo/modelo original y no se tocan.
  destroy() {
    this.scene.remove(this.group);
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    if (this._bodyMaterial) this._bodyMaterial.dispose();
  }
}
