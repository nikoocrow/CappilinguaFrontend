import { worldToChunk } from './mapConfig.js';
import { randomCharacterConfig } from './characterConfig.js';
import { KOREAN_GREETING_DIALOG } from '../UI/dialogs.js';

// Capa "ligera" del streaming (regla 17 del system design): metadata de
// spawns de NPCs indexada por celda. Hoy es una tabla fija con un único NPC;
// el contrato con NpcPopulation es el mismo que tendría un manifest real
// por chunk: dado (cx, cz), devolver los spawns de esa celda.

// PRNG chico y determinístico (mulberry32) sembrado con un hash de la celda,
// para que el outfit del NPC sea aleatorio pero estable entre cargas.
function cellRng(cx, cz) {
  let seed = ((cx * 73856093) ^ (cz * 19349663) ^ 0x9e3779b9) | 0;
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIXED_SPAWNS = [{ x: 6, z: -4, name: 'Capi', dialog: KOREAN_GREETING_DIALOG }];

export function spawnsForChunk(cx, cz) {
  const spawns = [];
  for (const spawn of FIXED_SPAWNS) {
    const cell = worldToChunk(spawn.x, spawn.z);
    if (cell.cx !== cx || cell.cz !== cz) continue;
    spawns.push({ ...spawn, config: randomCharacterConfig(cellRng(cx, cz)) });
  }
  return spawns;
}
