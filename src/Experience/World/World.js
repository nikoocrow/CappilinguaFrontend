import Experience from '../Experience.js';
import Environment from './Environment.js';
import Floor from './Floor.js';
import Player from './Player.js';
import TargetMarker from './TargetMarker.js';
import NpcPopulation from './NpcPopulation.js';
import ChunkGrid from './ChunkGrid.js';
import Input from '../Input/Input.js';
import { DialogUI } from '../UI/DialogUI.js';

// Zoom al que se acerca la cámara mientras la tarjeta de diálogo está abierta
const DIALOG_ZOOM = 1.8;

export default class World {
  constructor() {
    this.experience = new Experience();
    this.camera = this.experience.camera;
    this.resources = this.experience.resources;

    this.dialog = new DialogUI();
    // NPC al que el jugador va caminando para hablarle
    this.pendingNPC = null;
    // Zoom que tenía el usuario antes de abrirse el diálogo (null = cerrado)
    this._preDialogZoom = null;

    this.resources.on('ready', () => {
      this.environment = new Environment();
      this.floor = new Floor();

      // Los NPCs viven asociados a las tiles: cada celda que entra al radio
      // de carga spawnea sus NPCs (npcSpawns.js) y los despawnea al salir.
      this.population = new NpcPopulation({ onDespawn: (npc) => this._onNpcDespawned(npc) });
      this.chunkGrid = new ChunkGrid({
        onChunkLoaded: (cx, cz) => this.population.spawnChunk(cx, cz),
        onChunkUnloaded: (cx, cz) => this.population.despawnChunk(cx, cz),
      });

      this.player = new Player();
      this.marker = new TargetMarker();
      this.npcs = this.population.npcs; // array vivo, mutado por la población

      this.camera.setTarget(this.player.group);

      this.input = new Input({
        ground: this.floor.mesh,
        npcs: this.npcs,
        onGround: (x, z, running) => this._onGround(x, z, running),
        onNPC: (npc) => this._onNPC(npc),
      });
    });
  }

  // Si el NPC con el que se interactuaba desaparece con su chunk, limpiar
  // las referencias para no perseguir/dialogar con un objeto fuera de escena.
  _onNpcDespawned(npc) {
    if (this.pendingNPC === npc) this.pendingNPC = null;
    if (this.dialog.npc === npc) this.dialog.close();
  }

  _onGround(x, z, running) {
    this.pendingNPC = null;
    this.dialog.close();
    this.player.setTarget(x, z, running);
    this.marker.showAt(x, z);
  }

  _onNPC(npc) {
    this.dialog.close();
    if (npc.isNear(this.player.position)) {
      this.dialog.open(npc);
    } else {
      this.pendingNPC = npc;
      const spot = npc.approachPoint(this.player.position);
      this.player.setTarget(spot.x, spot.z);
      this.marker.showAt(spot.x, spot.z);
    }
  }

  update() {
    if (!this.player) return;

    this.player.update();
    this.marker.update();
    this.chunkGrid.update(this.player.position, this.experience.time.delta);
    for (const npc of this.npcs) npc.update(this.player.position);

    // Al llegar junto al NPC pendiente, abrir el diálogo
    if (this.pendingNPC && this.pendingNPC.isNear(this.player.position)) {
      this.dialog.open(this.pendingNPC);
      this.pendingNPC = null;
    }

    // Si el jugador se aleja, cerrar la conversación
    if (this.dialog.isOpen && !this.dialog.npc.isNear(this.player.position)) {
      this.dialog.close();
    }

    // Zoom de cámara ligado al estado del diálogo. Se detecta la transición
    // acá (y no en los open/close de World) porque el diálogo también puede
    // cerrarse desde su propio botón ×.
    if (this.dialog.isOpen && this._preDialogZoom === null) {
      this._preDialogZoom = this.camera.zoomTarget;
      this.camera.zoomTarget = Math.max(this.camera.zoomTarget, DIALOG_ZOOM);
    } else if (!this.dialog.isOpen && this._preDialogZoom !== null) {
      this.camera.zoomTarget = this._preDialogZoom;
      this._preDialogZoom = null;
    }
  }
}
