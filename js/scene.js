import * as THREE from 'three';

export const PLANE_SIZE = 30;
export const FRUSTUM_SIZE = 20;

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1d24);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(15, 25, 10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  dirLight.shadow.mapSize.set(2048, 2048);
  scene.add(dirLight);

  return scene;
}

export function createIsometricCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.OrthographicCamera(
    (-FRUSTUM_SIZE * aspect) / 2,
    (FRUSTUM_SIZE * aspect) / 2,
    FRUSTUM_SIZE / 2,
    -FRUSTUM_SIZE / 2,
    0.1,
    1000
  );
  // Ángulo isométrico clásico: 45° en Y, ~35.26° de elevación
  const d = 30;
  camera.position.set(d, d * Math.tan(THREE.MathUtils.degToRad(35.264)) * Math.SQRT2, d);
  camera.lookAt(0, 0, 0);
  return camera;
}

export function createGround(scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE),
    new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(PLANE_SIZE, PLANE_SIZE, 0x4c566a, 0x3b4252);
  grid.position.y = 0.01;
  scene.add(grid);

  return ground;
}

export function createCameraFollow(camera, target, smoothness = 4) {
  // La cámara conserva su desplazamiento isométrico respecto al objetivo:
  // solo se traslada, nunca rota, así la vista isométrica se mantiene.
  const offset = camera.position.clone();
  const desired = new THREE.Vector3();

  return function update(dt) {
    desired.copy(target.position).setY(0).add(offset);
    // Interpolación exponencial: suave e independiente del framerate
    const t = 1 - Math.exp(-smoothness * dt);
    camera.position.lerp(desired, t);
  };
}

export function setupResize(camera, renderer) {
  window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = (-FRUSTUM_SIZE * aspect) / 2;
    camera.right = (FRUSTUM_SIZE * aspect) / 2;
    camera.top = FRUSTUM_SIZE / 2;
    camera.bottom = -FRUSTUM_SIZE / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
