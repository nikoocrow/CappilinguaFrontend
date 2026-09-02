import { GRID_DIM } from './mapConfig.js';

// Layout de la red de carreteras como datos, no código imperativo (handoff
// §4): agregar o mover una avenida es editar AVENUE_INDICES, no tocar la
// lógica de construcción de RoadNetwork.js.
export const RoadTile = {
  NONE: 'NONE',
  STRAIGHT_NS: 'STRAIGHT_NS', // orientación base del tile recto (corre en Z)
  STRAIGHT_EW: 'STRAIGHT_EW', // recto rotado 90°, corre en X
  CURVE: 'CURVE',
  CROSS: 'CROSS',
};

// Avenidas en las columnas/filas 2, 5 y 8: 3 por eje, 9 intersecciones,
// manzanas de 2x2 chunks (40x40 unidades) para los edificios.
const AVENUE_INDICES = [2, 5, 8];

function cellAt(cx, cz) {
  const col = AVENUE_INDICES.includes(cx); // avenida norte-sur en esta columna
  const row = AVENUE_INDICES.includes(cz); // avenida este-oeste en esta fila

  if (col && row) return { type: RoadTile.CROSS, rotation: 0 }; // simétrico, no importa la rotación
  if (col) return { type: RoadTile.STRAIGHT_NS, rotation: 0 };
  if (row) return { type: RoadTile.STRAIGHT_EW, rotation: 1 }; // *90° para correr en X
  return { type: RoadTile.NONE, rotation: 0 };
}

// roadLayout[cz][cx] = { type, rotation }. `rotation` son pasos de 90°
// (k, aplicado como rotation.y = k * Math.PI / 2), no radianes.
export const roadLayout = [];
for (let cz = 0; cz < GRID_DIM; cz++) {
  const row = [];
  for (let cx = 0; cx < GRID_DIM; cx++) row.push(cellAt(cx, cz));
  roadLayout.push(row);
}
