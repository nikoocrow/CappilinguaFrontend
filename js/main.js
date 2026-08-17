import * as THREE from 'three';
import { createRenderer, createScene, createIsometricCamera, createGround, createCameraFollow, setupResize } from './scene.js';
import { Arrow, TargetMarker } from './arrow.js';
import { NPC } from './npc.js';
import { DialogUI } from './dialog.js';
import { KOREAN_GREETING_DIALOG } from './dialogs.js';
import { setupPointerInput } from './input.js';

const renderer = createRenderer();
const scene = createScene();
const camera = createIsometricCamera();
const ground = createGround(scene);

const arrow = new Arrow(scene);
const marker = new TargetMarker(scene);

const capi = new NPC(scene, { x: 6, z: -4, name: 'Capi', dialog: KOREAN_GREETING_DIALOG });
const npcs = [capi];

const dialog = new DialogUI();

// NPC al que el jugador va caminando para hablarle
let pendingNPC = null;

setupPointerInput(camera, renderer.domElement, ground, npcs, {
  onGround(x, z) {
    pendingNPC = null;
    dialog.close();
    arrow.setTarget(x, z);
    marker.showAt(x, z);
  },
  onNPC(npc) {
    dialog.close();
    if (npc.isNear(arrow.position)) {
      dialog.open(npc);
    } else {
      pendingNPC = npc;
      const spot = npc.approachPoint(arrow.position);
      arrow.setTarget(spot.x, spot.z);
      marker.showAt(spot.x, spot.z);
    }
  },
});

setupResize(camera, renderer);

const updateCamera = createCameraFollow(camera, arrow.group);
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  arrow.update(dt);
  marker.update(dt);
  for (const npc of npcs) npc.update(dt, arrow.position);
  updateCamera(dt);

  // Al llegar junto al NPC pendiente, abrir el diálogo
  if (pendingNPC && pendingNPC.isNear(arrow.position)) {
    dialog.open(pendingNPC);
    pendingNPC = null;
  }

  // Si el jugador se aleja, cerrar la conversación
  if (dialog.isOpen && !dialog.npc.isNear(arrow.position)) {
    dialog.close();
  }

  renderer.render(scene, camera);
}
animate();
