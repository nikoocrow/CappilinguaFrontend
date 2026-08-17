import * as THREE from 'three';

const SPEED = 8;       // unidades por segundo
const TURN_SPEED = 10; // rapidez de giro
const REST_HEIGHT = 0.5;

export class Arrow {
  constructor(scene) {
    // Cuerpo (cilindro) + punta (cono), apuntando hacia +Z
    this.group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 16), material);
    body.rotation.x = Math.PI / 2;
    body.position.z = -0.35;
    body.castShadow = true;
    this.group.add(body);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 16), material);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.7;
    tip.castShadow = true;
    this.group.add(tip);

    this.group.position.set(0, REST_HEIGHT, 0);
    scene.add(this.group);

    this.target = this.group.position.clone();
    this._dir = new THREE.Vector3();
  }

  get position() {
    return this.group.position;
  }

  setTarget(x, z) {
    this.target.set(x, this.group.position.y, z);
  }

  update(dt) {
    this._dir.subVectors(this.target, this.group.position);
    const dist = this._dir.length();

    if (dist > 0.05) {
      this._dir.normalize();

      // Girar suavemente hacia la dirección de movimiento
      const targetAngle = Math.atan2(this._dir.x, this._dir.z);
      let delta = targetAngle - this.group.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.group.rotation.y += delta * Math.min(1, TURN_SPEED * dt);

      const step = Math.min(SPEED * dt, dist);
      this.group.position.addScaledVector(this._dir, step);

      // Pequeño rebote al caminar
      this.group.position.y = REST_HEIGHT + Math.abs(Math.sin(performance.now() * 0.012)) * 0.15;
    } else {
      this.group.position.y += (REST_HEIGHT - this.group.position.y) * Math.min(1, 10 * dt);
    }
  }
}

export class TargetMarker {
  constructor(scene) {
    this.mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x88c0d0, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.02;
    scene.add(this.mesh);

    this.fade = 0;
  }

  showAt(x, z) {
    this.mesh.position.set(x, 0.02, z);
    this.fade = 1;
  }

  update(dt) {
    if (this.fade <= 0) return;
    this.fade = Math.max(0, this.fade - dt * 0.8);
    this.mesh.material.opacity = this.fade;
    const s = 1 + (1 - this.fade) * 0.6;
    this.mesh.scale.set(s, s, s);
  }
}
