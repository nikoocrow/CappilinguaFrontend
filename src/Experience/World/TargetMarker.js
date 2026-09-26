import * as THREE from 'three';
import Experience from '../Experience.js';
import { GROUND_TOP } from './Street.js';

// Geometría/material a nivel de módulo: un único anillo reutilizado, no hay
// razón para reinstanciarlo por Experience.
const geometry = new THREE.RingGeometry(0.35, 0.5, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x88c0d0, transparent: true, opacity: 0, side: THREE.DoubleSide });

// Por encima de GROUND_TOP (la superficie visible más alta del blockout de
// Street.js, la vereda) y no del y=0 de Floor.js: a 0.02 el marcador quedaba
// tapado por la calle/vereda en cuanto se clickeaba sobre el blockout en vez
// del grid base, y solo se veía ahí donde no había street cargado encima.
const MARKER_HEIGHT = GROUND_TOP + 0.01;

export default class TargetMarker {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;

    this.mesh = new THREE.Mesh(geometry, material.clone());
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = MARKER_HEIGHT;
    this.scene.add(this.mesh);

    this.fade = 0;
  }

  showAt(x, z) {
    this.mesh.position.set(x, MARKER_HEIGHT, z);
    this.fade = 1;
  }

  update() {
    if (this.fade <= 0) return;
    this.fade = Math.max(0, this.fade - this.time.delta * 0.8);
    this.mesh.material.opacity = this.fade;
    const s = 1 + (1 - this.fade) * 0.6;
    this.mesh.scale.set(s, s, s);
  }
}
