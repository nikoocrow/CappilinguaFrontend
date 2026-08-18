import * as THREE from 'three';
import Experience from '../Experience.js';
import { MAP_SIZE } from '../World/mapConfig.js';

const DOUBLE_CLICK_MS = 350;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_SPEED = 0.0015;

// Raycasting de clicks sobre el canvas: primero prueba contra los NPCs
// (onNPC), y si no, contra el suelo (onGround). Los clicks en la UI de
// diálogo no llegan aquí porque el listener vive en el canvas.
export default class Input {
  constructor({ ground, npcs, onGround, onNPC }) {
    this.experience = new Experience();
    this.camera = this.experience.camera;
    this.canvas = this.experience.canvas;
    this.ground = ground;
    this.npcs = npcs;
    this.onGround = onGround;
    this.onNPC = onNPC;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._lastGroundClick = -Infinity;

    this.canvas.addEventListener('pointerdown', (event) => this._handlePointerDown(event));
    this.canvas.addEventListener('wheel', (event) => this._handleWheel(event), { passive: false });
  }

  _handlePointerDown(event) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera.instance);

    // ¿Click sobre un NPC?
    for (const npc of this.npcs) {
      if (this.raycaster.intersectObject(npc.group, true).length > 0) {
        this.onNPC(npc);
        return;
      }
    }

    // Click sobre el suelo
    const hits = this.raycaster.intersectObject(this.ground);
    if (hits.length > 0) {
      const p = hits[0].point;
      // Limitar al plano
      const half = MAP_SIZE / 2 - 0.5;
      const x = THREE.MathUtils.clamp(p.x, -half, half);
      const z = THREE.MathUtils.clamp(p.z, -half, half);

      // Doble click seguido: correr hacia el punto en vez de caminar
      const now = performance.now();
      const running = now - this._lastGroundClick < DOUBLE_CLICK_MS;
      this._lastGroundClick = running ? -Infinity : now;

      this.onGround(x, z, running);
    }
  }

  // Zoom con la rueda del ratón: en una cámara ortográfica basta con ajustar
  // `zoom` (no hay que mover la cámara ni tocar el frustum).
  _handleWheel(event) {
    event.preventDefault();
    const camera = this.camera.instance;
    camera.zoom = THREE.MathUtils.clamp(camera.zoom - event.deltaY * ZOOM_SPEED, ZOOM_MIN, ZOOM_MAX);
    camera.updateProjectionMatrix();
  }
}
