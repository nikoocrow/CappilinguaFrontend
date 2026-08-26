import * as THREE from 'three';
import Experience from '../Experience.js';
import { MAP_SIZE } from './mapConfig.js';

export default class Floor {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    this.setMesh();
  }

  // Plano base de todo el mapa: es la capa "lógica" siempre presente (clic
  // para moverse funciona en cualquier punto), independiente de qué chunks
  // estén cargados visualmente encima (ver ChunkGrid.js).
  setMesh() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x232730, roughness: 0.9 })
    );
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;
    // El suelo es estático: matriz congelada, no se recompone por frame.
    this.mesh.updateMatrix();
    this.mesh.matrixAutoUpdate = false;
    this.scene.add(this.mesh);
  }
}
