import Npc from './Npc.js';
import { spawnsForChunk } from './npcSpawns.js';

// Población dinámica, separada del streaming de geometría (regla 15 del
// system design): los NPCs aparecen/desaparecen sin transición cuando su
// celda entra o sale del radio de carga. `npcs` es un único array mutado en
// el lugar, así Input y World conservan la misma referencia siempre.
export default class NpcPopulation {
  constructor({ onDespawn } = {}) {
    this.npcs = [];
    this.onDespawn = onDespawn;
    this._byChunk = new Map(); // "cx,cz" -> Npc[]
  }

  spawnChunk(cx, cz) {
    const key = `${cx},${cz}`;
    if (this._byChunk.has(key)) return;

    const spawned = spawnsForChunk(cx, cz).map((spawn) => new Npc(spawn));
    this._byChunk.set(key, spawned);
    this.npcs.push(...spawned);
  }

  despawnChunk(cx, cz) {
    const key = `${cx},${cz}`;
    const spawned = this._byChunk.get(key);
    if (!spawned) return;
    this._byChunk.delete(key);

    for (const npc of spawned) {
      npc.destroy();
      const index = this.npcs.indexOf(npc);
      if (index !== -1) this.npcs.splice(index, 1);
      this.onDespawn?.(npc);
    }
  }
}
