import Experience from '../Experience.js';
import Environment from './Environment.js';
import Floor from './Floor.js';
import RoadNetwork from './RoadNetwork.js';
import Traffic from './Traffic.js';
import Player from './Player.js';
import TargetMarker from './TargetMarker.js';
import NpcPopulation from './NpcPopulation.js';
import ChunkGrid from './ChunkGrid.js';
import Input from '../Input/Input.js';
import { DialogUI } from '../UI/DialogUI.js';
import { getPlayerState, savePlayerState } from './playerState.js';

// Zoom al que se acerca la cámara mientras la tarjeta de diálogo está abierta
const DIALOG_ZOOM = 1.8;
// Radio del jugador para la colisión contra las cajas de los autos (regla
// de Traffic.js: caja del auto expandida por este radio, jugador tratado
// como un punto). El frenado por obstáculo es comportamental, no una
// pared física -- si el jugador camina hacia un auto en movimiento más
// rápido de lo que el auto llega a reaccionar, sin esto se superponen.
const PLAYER_COLLISION_RADIUS = 0.4;
// Umbral de "no se movió de verdad este frame", para corregir la animación
// a idle cuando un auto bloquea el avance -- bien por debajo de un paso
// normal de caminata (~0.077 a SPEED=4.8 y 60fps), para no disparar en una
// desaceleración legítima al llegar al destino.
const STUCK_MOVE_THRESHOLD = 0.01;

export default class World {
  constructor() {
    this.experience = new Experience();
    this.camera = this.experience.camera;
    this.resources = this.experience.resources;

    this.dialog = new DialogUI(this.experience.container ?? document.body);
    // NPC al que el jugador va caminando para hablarle
    this.pendingNPC = null;
    // Scratch reusado por frame (regla 2): jugador + NPCs, para que
    // Traffic.js sepa a quién esquivar sin que World le pase referencias
    // directas a Player/NpcPopulation.
    this._obstacles = [];
    // Zoom que tenía el usuario antes de abrirse el diálogo (null = cerrado)
    this._preDialogZoom = null;

    this.resources.on('ready', () => {
      this.environment = new Environment();
      this.floor = new Floor();
      this.roads = new RoadNetwork();
      this.traffic = new Traffic();

      // Los NPCs viven asociados a las tiles: cada celda que entra al radio
      // de carga spawnea sus NPCs (npcSpawns.js) y los despawnea al salir.
      this.population = new NpcPopulation({ onDespawn: (npc) => this._onNpcDespawned(npc) });
      this.chunkGrid = new ChunkGrid({
        onChunkLoaded: (cx, cz) => this.population.spawnChunk(cx, cz),
        onChunkUnloaded: (cx, cz) => this.population.despawnChunk(cx, cz),
      });

      if (this.experience.debug.active) {
        const tilesToggle = { visible: true };
        this.experience.debug.ui
          .addFolder('Chunks')
          .add(tilesToggle, 'visible')
          .name('Ver tiles')
          .onChange((visible) => this.chunkGrid.setTilesVisible(visible));
      }

      this.player = new Player();
      this.marker = new TargetMarker();
      this.npcs = this.population.npcs; // array vivo, mutado por la población

      this.camera.setTarget(this.player.group);
      this.camera.snapZoom(getPlayerState().zoom);

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

    // Posición real al empezar el frame, para saber después si el auto
    // anuló el avance de este frame (ver más abajo, cerca de forceIdle).
    const startX = this.player.position.x;
    const startZ = this.player.position.z;

    this.player.update();
    this.marker.update();

    // Por ahora solo el jugador frena al tráfico -- los NPCs quedan afuera
    // a propósito (están quietos todo el tiempo, no hace falta que además
    // corten la calle). Traffic.js no sabe ni le importa qué es cada
    // obstáculo, así que sumar NPCs de nuevo es solo agregarlos acá.
    // `length = 0` en vez de reasignar el arreglo: mismo objeto reusado.
    this._obstacles.length = 0;
    this._obstacles.push(this.player);
    this.traffic.update(this._obstacles);

    // Empujar al jugador afuera de cualquier caja de auto en la que haya
    // quedado, en vez de solo prevenir entrar (ver resolvePlayerPosition:
    // "prevenir" nada más se traba si el jugador arranca el frame ya
    // adentro, que pasa apenas un auto frena cerca).
    const resolved = this.traffic.resolvePlayerPosition(
      this.player.position.x,
      this.player.position.z,
      PLAYER_COLLISION_RADIUS
    );
    this.player.group.position.x = resolved.x;
    this.player.group.position.z = resolved.z;

    // Player.update() ya decidió su animación mirando la distancia al
    // target, no lo que realmente avanzó -- si un auto bloqueó (casi) todo
    // el paso de este frame, corregir a idle para que no quede caminando/
    // corriendo en el lugar contra el auto.
    const actualMove = Math.hypot(resolved.x - startX, resolved.z - startZ);
    if (actualMove < STUCK_MOVE_THRESHOLD) {
      this.player.forceIdle();
    }

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

  // La tarjeta de diálogo es DOM propio, fuera de la escena: el traverse
  // de Experience.destroy no la alcanza.
  destroy() {
    // Última parada del jugador antes de que se destruya la escena: al volver
    // a la pantalla, el mundo se rearma alrededor de este punto en vez del
    // origen (playerState.js). Puede no haber jugador todavía si se sale
    // antes de que Resources termine de cargar.
    if (this.player) {
      savePlayerState({
        position: this.player.position,
        rotationY: this.player.group.rotation.y,
        // Con el diálogo abierto el zoom vigente es el suyo, no el que eligió
        // el usuario: se guarda el de antes de abrirlo.
        zoom: this._preDialogZoom ?? this.camera.zoomTarget,
      });
    }

    this.dialog.destroy();
  }
}
