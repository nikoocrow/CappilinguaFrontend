import Experience from '../Experience.js';
import Chunk from './Chunk.js';
import { GRID_DIM, chunkCenter, worldToChunk } from './mapConfig.js';

const LOAD_RADIUS = 1; // distancia Chebyshev: carga una vecindad de 3x3 chunks

// Gestiona qué celdas de la grilla están cargadas según la posición del
// jugador. Hoy los chunks son solo un placeholder visual (Chunk.js), pero
// el mecanismo de carga/descarga es el mismo que se usaría con contenido
// real: recalcula la vecindad necesaria solo cuando el jugador cambia de
// celda, nunca en cada frame (ver reglas 14-18 de system-design.md).
export default class ChunkGrid {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    this.chunks = new Map(); // key "cx,cz" -> Chunk
    this._playerChunk = null;
  }

  update(playerPosition, dt) {
    const current = worldToChunk(playerPosition.x, playerPosition.z);
    const changedCell =
      !this._playerChunk || current.cx !== this._playerChunk.cx || current.cz !== this._playerChunk.cz;

    if (changedCell) {
      this._playerChunk = current;
      this._reconcile(current);
    }

    this._updateFades(dt);
  }

  _neededChunks(centerChunk) {
    const needed = new Set();
    for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
      for (let dz = -LOAD_RADIUS; dz <= LOAD_RADIUS; dz++) {
        const cx = centerChunk.cx + dx;
        const cz = centerChunk.cz + dz;
        if (cx < 0 || cx >= GRID_DIM || cz < 0 || cz >= GRID_DIM) continue;
        needed.add(`${cx},${cz}`);
      }
    }
    return needed;
  }

  _reconcile(centerChunk) {
    const needed = this._neededChunks(centerChunk);

    for (const key of needed) {
      if (this.chunks.has(key)) continue;
      const [cx, cz] = key.split(',').map(Number);
      const chunk = new Chunk(cx, cz, chunkCenter(cx, cz));
      this.scene.add(chunk.group);
      this.chunks.set(key, chunk);
    }

    for (const [key, chunk] of this.chunks) {
      if (needed.has(key)) {
        chunk.setActive(chunk.cx === centerChunk.cx && chunk.cz === centerChunk.cz);
      } else {
        chunk.markForRemoval();
      }
    }
  }

  _updateFades(dt) {
    for (const [key, chunk] of this.chunks) {
      if (chunk.updateFade(dt)) {
        this.scene.remove(chunk.group);
        chunk.dispose();
        this.chunks.delete(key);
      }
    }
  }
}
