import * as THREE from 'three';
import Experience from '../Experience.js';
import { MAP_SIZE } from '../World/mapConfig.js';

const DOUBLE_CLICK_MS = 350;
// Exportados porque la barra de zoom del mapa (UI de React) mueve el mismo
// camera.zoomTarget que la rueda y necesita los mismos topes.
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.25;
const ZOOM_SPEED = 0.0015;

// Cuánto hay que arrastrar (px) antes de considerarlo un drag de cámara en
// vez de un click: evita que un click con la mano temblorosa dispare una
// rotación de 0.001 rad en vez de mover/hablar.
const DRAG_THRESHOLD = 4;
const DRAG_ROTATE_SPEED = 0.006; // rad por pixel arrastrado
const KEY_ROTATE_SPEED = 2.2; // rad/s mientras Q o E están apretadas

// Raycasting de clicks sobre el canvas: primero prueba contra los NPCs
// (onNPC), y si no, contra el suelo (onGround). Los clicks en la UI de
// diálogo no llegan aquí porque el listener vive en el canvas. El click ya
// no se dispara en pointerdown sino en pointerup, para poder distinguirlo
// de un arrastre que rota la cámara (ver _handlePointerMove).
export default class Input {
  constructor({ ground, npcs, onGround, onNPC }) {
    this.experience = new Experience();
    this.camera = this.experience.camera;
    this.time = this.experience.time;
    this.canvas = this.experience.canvas;
    this.ground = ground;
    this.npcs = npcs;
    this.onGround = onGround;
    this.onNPC = onNPC;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._lastGroundClick = -Infinity;

    this._dragging = false;
    this._pointerId = null;
    this._lastX = 0;
    this._lastY = 0;
    this._downX = 0;
    this._downY = 0;

    // Q/E mantenidas: se leen por frame en update(), la rotación no se
    // aplica de una vez en el propio keydown (regla 1 del system design).
    this._rotateLeft = false;
    this._rotateRight = false;

    this._onPointerDown = (event) => this._handlePointerDown(event);
    this._onPointerMove = (event) => this._handlePointerMove(event);
    this._onPointerUp = (event) => this._handlePointerUp(event);
    this._onWheel = (event) => this._handleWheel(event);
    this._onKeyDown = (event) => this._handleKeyDown(event);
    this._onKeyUp = (event) => this._handleKeyUp(event);

    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    // Q/E no dependen de que el canvas tenga foco (como cualquier atajo de
    // cámara tipo WASD), así que van a window en vez de al canvas.
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _handlePointerDown(event) {
    if (event.button !== 0) return; // solo botón izquierdo: click o drag de cámara
    this._dragging = false;
    this._pointerId = event.pointerId;
    this._downX = this._lastX = event.clientX;
    this._downY = this._lastY = event.clientY;
    // Mantiene los eventos de move/up dirigidos acá aunque el puntero salga
    // del canvas durante el arrastre.
    this.canvas.setPointerCapture(event.pointerId);
  }

  _handlePointerMove(event) {
    if (this._pointerId === null || event.pointerId !== this._pointerId) return;

    const dx = event.clientX - this._lastX;
    this._lastX = event.clientX;
    this._lastY = event.clientY;

    if (!this._dragging) {
      const totalDx = event.clientX - this._downX;
      const totalDy = event.clientY - this._downY;
      if (Math.hypot(totalDx, totalDy) < DRAG_THRESHOLD) return;
      this._dragging = true;
    }

    this.camera.rotateBy(-dx * DRAG_ROTATE_SPEED);
  }

  _handlePointerUp(event) {
    if (this._pointerId === null || event.pointerId !== this._pointerId) return;
    this.canvas.releasePointerCapture(event.pointerId);
    const wasDragging = this._dragging;
    this._dragging = false;
    this._pointerId = null;

    // Si hubo arrastre, ese gesto ya rotó la cámara: no interpretarlo
    // además como un click sobre el suelo/NPC.
    if (!wasDragging) this._handleClick(event);
  }

  _handleClick(event) {
    // NDC relativas al canvas, no a la ventana: el canvas ya no ocupa la
    // pantalla entera (vive en el área de contenido del shell), así que usar
    // innerWidth/innerHeight desviaría el rayo. Una llamada por click, no por
    // frame, así que el getBoundingClientRect no cuesta nada (regla 8).
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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
  // `zoom` (no hay que mover la cámara ni tocar el frustum). Se mueve el
  // zoomTarget y Camera.update lo interpola suavemente.
  _handleWheel(event) {
    event.preventDefault();
    this.camera.zoomTarget = THREE.MathUtils.clamp(
      this.camera.zoomTarget - event.deltaY * ZOOM_SPEED,
      ZOOM_MIN,
      ZOOM_MAX
    );
  }

  _handleKeyDown(event) {
    if (event.key === 'q' || event.key === 'Q') this._rotateLeft = true;
    else if (event.key === 'e' || event.key === 'E') this._rotateRight = true;
  }

  _handleKeyUp(event) {
    if (event.key === 'q' || event.key === 'Q') this._rotateLeft = false;
    else if (event.key === 'e' || event.key === 'E') this._rotateRight = false;
  }

  // Rotación continua mientras Q/E están apretadas. Colgada del tick único
  // vía World.update() (regla 1 del system design), nunca de un rAF propio.
  update() {
    if (!this._rotateLeft && !this._rotateRight) return;
    const direction = (this._rotateLeft ? 1 : 0) - (this._rotateRight ? 1 : 0);
    this.camera.rotateBy(direction * KEY_ROTATE_SPEED * this.time.delta);
  }

  // Los listeners de pointer/wheel viven en el canvas (se descartan solos
  // cuando React desmonta la pantalla y el canvas sale del DOM), pero Q/E
  // están en window, que nunca se destruye: sin este cleanup, cada
  // remontaje del juego (regla 27) apilaría otro par de listeners.
  destroy() {
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointercancel', this._onPointerUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
