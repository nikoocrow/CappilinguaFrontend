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
  // Los callbacks avisan cuándo una celda entra al radio de carga y cuándo
  // sale definitivamente (después del fade-out) — es el enganche para
  // sistemas que pueblan la celda, como NpcPopulation. Un chunk cuya
  // remoción se cancela nunca dispara onChunkUnloaded, así los pares
  // load/unload quedan siempre balanceados.
  constructor({ onChunkLoaded, onChunkUnloaded } = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    this.onChunkLoaded = onChunkLoaded;
    this.onChunkUnloaded = onChunkUnloaded;

    this.chunks = new Map(); // key "cx,cz" -> Chunk
    this._playerCx = null;
    this._playerCz = null;
    this._cell = { cx: 0, cz: 0 }; // scratch reusado por frame (regla 2)
    this._tilesVisible = true;
  }

  // Toggle de debug (ver World.js): oculta/muestra los tiles ya cargados y
  // deja la preferencia guardada para los que se carguen después, ya que
  // ChunkGrid crea y destruye Chunks todo el tiempo según por dónde camina
  // el jugador -- no alcanza con tocar solo los que existen ahora.
  setTilesVisible(visible) {
    this._tilesVisible = visible;
    for (const chunk of this.chunks.values()) chunk.group.visible = visible;
  }

  update(playerPosition, dt) {
    const cell = worldToChunk(playerPosition.x, playerPosition.z, this._cell);

    if (cell.cx !== this._playerCx || cell.cz !== this._playerCz) {
      this._playerCx = cell.cx;
      this._playerCz = cell.cz;
      this._reconcile(cell);
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
      chunk.group.visible = this._tilesVisible;
      this.scene.add(chunk.group);
      this.chunks.set(key, chunk);
      this.onChunkLoaded?.(cx, cz);
    }

    for (const [key, chunk] of this.chunks) {
      if (needed.has(key)) {
        chunk.cancelRemoval();
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
        this.onChunkUnloaded?.(chunk.cx, chunk.cz);
      }
    }
  }
}
