import * as THREE from 'three';

const FACE_RADIUS = 5;   // distancia a la que empieza a mirar al jugador
const TURN_SPEED = 5;

function makeBubbleSprite() {
  // Globo de "!" dibujado en un canvas para no depender de imágenes externas
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#eceff4';
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#bf616a';
  ctx.font = 'bold 76px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 64, 68);

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(0.8, 0.8, 1);
  return sprite;
}

export class NPC {
  constructor(scene, { x = 6, z = -4, name = 'NPC', dialog = null, color = 0xa3be8c } = {}) {
    this.name = name;
    this.dialog = dialog;
    this.interactRadius = 2.2;

    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.6, 8, 16), bodyMat);
    body.position.y = 0.65;
    body.castShadow = true;
    this.group.add(body);

    const headMat = new THREE.MeshStandardMaterial({ color: 0xe5c07b, roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), headMat);
    head.position.y = 1.5;
    head.castShadow = true;
    this.group.add(head);

    this.bubble = makeBubbleSprite();
    this.bubble.position.y = 2.3;
    this.group.add(this.bubble);

    this.group.position.set(x, 0, z);
    scene.add(this.group);

    this._time = Math.random() * Math.PI * 2;
  }

  get position() {
    return this.group.position;
  }

  // Punto de llegada: a interactRadius del NPC, en línea hacia el jugador
  approachPoint(fromPosition) {
    const dir = new THREE.Vector3().subVectors(fromPosition, this.group.position);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
    dir.normalize().multiplyScalar(this.interactRadius * 0.8);
    return new THREE.Vector3().addVectors(this.group.position, dir);
  }

  isNear(position) {
    const dx = position.x - this.group.position.x;
    const dz = position.z - this.group.position.z;
    return Math.hypot(dx, dz) <= this.interactRadius;
  }

  update(dt, playerPosition) {
    // El globo flota suavemente
    this._time += dt;
    this.bubble.position.y = 2.3 + Math.sin(this._time * 2.5) * 0.12;

    // Mirar al jugador cuando está cerca
    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    if (Math.hypot(dx, dz) < FACE_RADIUS) {
      const targetAngle = Math.atan2(dx, dz);
      let delta = targetAngle - this.group.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.group.rotation.y += delta * Math.min(1, TURN_SPEED * dt);
    }
  }
}
