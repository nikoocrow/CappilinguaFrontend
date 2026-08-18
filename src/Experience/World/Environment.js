import * as THREE from 'three';
import Experience from '../Experience.js';

export default class Environment {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.debug = this.experience.debug;

    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Luces');
    }

    this.setLights();
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 3.28);
    this.sunLight.position.set(15, 25, 10);
    // Sombras apagadas por defecto (costo de render evitable); activables
    // desde el debug con "Sombras activas" para probarlas puntualmente.
    this.sunLight.castShadow = false;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    // 1024 alcanza de sobra para este plano de 30x30 con cámara ortográfica
    // fija; 2048 cuadruplica el costo de render de sombra sin mejora visible
    // a esta escala.
    this.sunLight.shadow.mapSize.set(1024, 1024);
    // Evita shadow acne en mallas curvas (personaje): desplaza la geometría
    // a lo largo de su normal antes de comparar profundidad de sombra.
    this.sunLight.shadow.normalBias = 0.183;
    this.scene.add(this.sunLight);

    if (this.debug.active) {
      this.debugFolder.add(this.sunLight, 'intensity').name('Intensidad luz solar').min(0).max(5).step(0.01);
      this.debugFolder.add(this.sunLight, 'castShadow').name('Sombras activas');
      this.debugFolder.add(this.ambientLight, 'intensity').name('Intensidad ambiente').min(0).max(2).step(0.01);
      this.debugFolder.add(this.sunLight.shadow, 'normalBias').name('Normal bias sombra').min(0).max(0.2).step(0.001);
      this.debugFolder.add(this.sunLight.shadow, 'bias').name('Bias sombra').min(-0.005).max(0.005).step(0.0001);

      const shadowSettings = { mapSize: 1024 };
      this.debugFolder
        .add(shadowSettings, 'mapSize', [512, 1024, 2048])
        .name('Resolución de sombra')
        .onChange((size) => {
          this.sunLight.shadow.mapSize.set(size, size);
          this.sunLight.shadow.map?.dispose();
          this.sunLight.shadow.map = null;
        });
    }
  }
}
