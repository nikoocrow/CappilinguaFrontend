import * as THREE from 'three';
import Experience from '../Experience.js';
import { CHUNK_SIZE } from './mapConfig.js';

const FADE_SPEED = 3; // opacidad por segundo: ~0.33s para aparecer/desaparecer
const BASE_COLOR = 0x3b4252;
const ACTIVE_COLOR = 0x88c0d0;
// Y del plano del tile: por encima de Floor.js (Y=0) para no z-fightear con
// el piso base, y un pelo por debajo del asfalto (ver ROAD_SURFACE_DROP en
// RoadNetwork.js, que lee este mismo valor) para no z-fightear con la
// calle tampoco -- antes coincidían exactos, ahí empezó el parpadeo.
export const TILE_Y = 0.008;

// Geometría/material compartidos a nivel de módulo (regla 3 del system
// design): un plano un poco más chico que la celda para que quede un
// margen visible entre chunks vecinos, sin necesitar líneas aparte.
const geometry = new THREE.PlaneGeometry(CHUNK_SIZE * 0.94, CHUNK_SIZE * 0.94);
const material = new THREE.MeshStandardMaterial({ color: BASE_COLOR, roughness: 0.85, transparent: true });

// Texturas de label cacheadas por coordenada, para no recrear el canvas
// cada vez que un chunk se vuelve a cargar. Con una grilla chica esto cabe
// entero en memoria, pero si el jugador recorre una grilla grande el cache
// crecería sin límite (una textura nunca liberada por celda visitada) — se
// acota con eviction LRU simple (Map conserva orden de inserción).
const MAX_CACHED_LABELS = 128;
const labelCache = new Map();

function labelTexture(cx, cz) {
  const key = `${cx},${cz}`;
  if (labelCache.has(key)) {
    const texture = labelCache.get(key);
    labelCache.delete(key);
    labelCache.set(key, texture); // reinsertar: marcarla como usada recientemente
    return texture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eceff4';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${cx},${cz}`, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  labelCache.set(key, texture);

  if (labelCache.size > MAX_CACHED_LABELS) {
    const oldestKey = labelCache.keys().next().value;
    labelCache.get(oldestKey).dispose();
    labelCache.delete(oldestKey);
  }

  return texture;
}

// Una celda de la grilla de streaming. Hoy solo es un placeholder visual
// (plano de color + coordenada) para validar el mecanismo de carga/descarga;
// el contenido real (props, edificios) se agrega después sin tocar esta clase.
export default class Chunk {
  constructor(cx, cz, center) {
    this.cx = cx;
    this.cz = cz;
    this.active = false;
    this._opacity = 0;
    this._removing = false;

    this.group = new THREE.Group();
    this.group.position.set(center.x, TILE_Y, center.z);

    this.mesh = new THREE.Mesh(geometry, material.clone());
    this.mesh.material.opacity = 0;
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // La etiqueta de coordenadas es una ayuda de debug para validar el
    // mecanismo de streaming (regla 12 del system-design: instrumentos de
    // debug cuelgan de Debug.active), no contenido real -- un jugador
    // normal no la necesita, y cada una es un draw call de sprite más por
    // chunk cargado (hasta 9 con LOAD_RADIUS=1).
    this.label = null;
    if (new Experience().debug.active) {
      this.label = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: labelTexture(cx, cz), transparent: true, opacity: 0 })
      );
      this.label.position.y = 0.6;
      this.group.add(this.label);
    }

    // Los chunks nunca se mueven después de crearse (solo cambia la opacidad
    // de sus materiales): congelar las matrices evita recomponerlas por frame.
    for (const object of [this.group, this.mesh, this.label].filter(Boolean)) {
      object.updateMatrix();
      object.matrixAutoUpdate = false;
    }
  }

  setActive(active) {
    if (active === this.active) return;
    this.active = active;
    this.mesh.material.color.set(active ? ACTIVE_COLOR : BASE_COLOR);
  }

  markForRemoval() {
    this._removing = true;
  }

  // Si el jugador vuelve antes de que termine el fade-out, el chunk se
  // recupera desde la opacidad que tenga en vez de desaparecer y recrearse.
  cancelRemoval() {
    this._removing = false;
  }

  // Anima el fade in/out. Devuelve true cuando terminó de desvanecerse y
  // ya puede sacarse de la escena.
  updateFade(dt) {
    const target = this._removing ? 0 : 1;
    if (this._opacity === target) return false; // asentado: no tocar materiales por frame

    this._opacity = THREE.MathUtils.clamp(this._opacity + Math.sign(target - this._opacity) * FADE_SPEED * dt, 0, 1);
    this.mesh.material.opacity = this._opacity * 0.85;
    if (this.label) this.label.material.opacity = this._opacity;
    return this._removing && this._opacity <= 0;
  }

  // El material es un clone por instancia y se dispone acá; la geometría y
  // la textura del label son compartidas/cacheadas y no se tocan.
  dispose() {
    this.mesh.material.dispose();
    if (this.label) this.label.material.dispose();
  }
}
