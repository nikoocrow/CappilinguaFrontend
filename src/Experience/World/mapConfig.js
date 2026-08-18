// Fuente única de verdad para el tamaño del mapa y la grilla de chunks.
// Todo lo que necesita saber "dónde está cada celda" importa de acá
// (Floor para el plano de colisión, Input para el clamp de movimiento,
// ChunkGrid/Chunk para el streaming).
export const CHUNK_SIZE = 20; // tamaño de cada celda individual
export const GRID_DIM = 10; // cantidad de celdas por lado: mapa total = CHUNK_SIZE * GRID_DIM
export const MAP_SIZE = CHUNK_SIZE * GRID_DIM;

const HALF_GRID = (GRID_DIM - 1) / 2;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Centro en mundo de la celda (cx, cz), con el mapa centrado en el origen
// igual que el plano de suelo existente.
export function chunkCenter(cx, cz) {
  return {
    x: (cx - HALF_GRID) * CHUNK_SIZE,
    z: (cz - HALF_GRID) * CHUNK_SIZE,
  };
}

// Coordenada de celda a la que pertenece una posición de mundo, clampeada
// a los límites de la grilla.
export function worldToChunk(x, z) {
  const cx = Math.round(x / CHUNK_SIZE + HALF_GRID);
  const cz = Math.round(z / CHUNK_SIZE + HALF_GRID);
  return {
    cx: clamp(cx, 0, GRID_DIM - 1),
    cz: clamp(cz, 0, GRID_DIM - 1),
  };
}
