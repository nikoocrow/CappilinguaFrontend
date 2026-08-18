import Experience from '../Experience.js';
import Environment from './Environment.js';
import Floor from './Floor.js';
import Player from './Player.js';
import TargetMarker from './TargetMarker.js';
import Npc from './Npc.js';
import ChunkGrid from './ChunkGrid.js';
import Input from '../Input/Input.js';
import { DialogUI } from '../UI/DialogUI.js';
import { KOREAN_GREETING_DIALOG } from '../UI/dialogs.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.camera = this.experience.camera;
    this.resources = this.experience.resources;

    this.dialog = new DialogUI();
    // NPC al que el jugador va caminando para hablarle
    this.pendingNPC = null;

    this.resources.on('ready', () => {
      this.environment = new Environment();
      this.floor = new Floor();
      this.chunkGrid = new ChunkGrid();
      this.player = new Player();
      this.marker = new TargetMarker();
      this.npcs = [new Npc({ x: 6, z: -4, name: 'Capi', dialog: KOREAN_GREETING_DIALOG })];

      this.camera.setTarget(this.player.group);

      this.input = new Input({
        ground: this.floor.mesh,
        npcs: this.npcs,
        onGround: (x, z, running) => this._onGround(x, z, running),
        onNPC: (npc) => this._onNPC(npc),
      });
    });
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
  }
}
