import * as THREE from 'three';
import Experience from '../Experience.js';

export const PLANE_SIZE = 30;

export default class Floor {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    this.setMesh();
    this.setGrid();
  }

  setMesh() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.9 })
    );
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  setGrid() {
    this.grid = new THREE.GridHelper(PLANE_SIZE, PLANE_SIZE, 0x4c566a, 0x3b4252);
    this.grid.position.y = 0.01;
    this.scene.add(this.grid);
  }
}
