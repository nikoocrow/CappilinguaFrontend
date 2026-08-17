import * as THREE from 'three';
import { PLANE_SIZE } from './scene.js';

// Raycasting de clicks sobre el canvas: primero prueba contra los NPCs
// (onNPC), y si no, contra el suelo (onGround). Los clicks en la UI de
// diálogo no llegan aquí porque el listener vive en el canvas.
export function setupPointerInput(camera, canvas, ground, npcs, { onGround, onNPC }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  canvas.addEventListener('pointerdown', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // ¿Click sobre un NPC?
    for (const npc of npcs) {
      if (raycaster.intersectObject(npc.group, true).length > 0) {
        onNPC(npc);
        return;
      }
    }

    // Click sobre el suelo
    const hits = raycaster.intersectObject(ground);
    if (hits.length > 0) {
      const p = hits[0].point;
      // Limitar al plano
      const half = PLANE_SIZE / 2 - 0.5;
      const x = THREE.MathUtils.clamp(p.x, -half, half);
      const z = THREE.MathUtils.clamp(p.z, -half, half);
      onGround(x, z);
    }
  });
}
