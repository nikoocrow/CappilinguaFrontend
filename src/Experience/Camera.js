import * as THREE from 'three';
import Experience from './Experience.js';

export const FRUSTUM_SIZE = 20;
const ISO_DISTANCE = 30;
const FOLLOW_SMOOTHNESS = 4;
const ZOOM_SMOOTHNESS = 4;

export default class Camera {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;

    this._target = null;
    this._desired = new THREE.Vector3();
    this._offset = new THREE.Vector3();

    // Zoom deseado: el update interpola instance.zoom hacia este valor,
    // así tanto la rueda como el zoom de diálogo quedan suavizados.
    this.zoomTarget = 1;

    this.setInstance();
  }

  setInstance() {
    const aspect = this.sizes.width / this.sizes.height;
    this.instance = new THREE.OrthographicCamera(
      (-FRUSTUM_SIZE * aspect) / 2,
      (FRUSTUM_SIZE * aspect) / 2,
      FRUSTUM_SIZE / 2,
      -FRUSTUM_SIZE / 2,
      0.1,
      1000
    );

    // Ángulo isométrico clásico: 45° en Y, ~35.26° de elevación
    const d = ISO_DISTANCE;
    this.instance.position.set(d, d * Math.tan(THREE.MathUtils.degToRad(35.264)) * Math.SQRT2, d);
    this.instance.lookAt(0, 0, 0);

    this._offset.copy(this.instance.position);
    this.scene.add(this.instance);
  }

  // La cámara conserva su desplazamiento isométrico respecto al objetivo:
  // solo se traslada, nunca rota, así la vista isométrica se mantiene.
  setTarget(object3D) {
    this._target = object3D;
    // Saltar de una al objetivo en vez de interpolar: si el jugador arranca
    // lejos del origen (posición restaurada al volver a la pantalla), sin
    // esto la cámara haría un viaje de un segundo hasta alcanzarlo.
    this._desired.copy(object3D.position).setY(0).add(this._offset);
    this.instance.position.copy(this._desired);
  }

  // Zoom sin interpolación, por el mismo motivo que el salto de setTarget:
  // tocar solo `zoomTarget` al restaurar haría que la cámara se acercara sola
  // durante el primer segundo de la escena.
  snapZoom(value) {
    this.zoomTarget = value;
    this.instance.zoom = value;
    this.instance.updateProjectionMatrix();
  }

  resize() {
    const aspect = this.sizes.width / this.sizes.height;
    this.instance.left = (-FRUSTUM_SIZE * aspect) / 2;
    this.instance.right = (FRUSTUM_SIZE * aspect) / 2;
    this.instance.top = FRUSTUM_SIZE / 2;
    this.instance.bottom = -FRUSTUM_SIZE / 2;
    this.instance.updateProjectionMatrix();
  }

  update(dt) {
    if (!this._target) return;

    this._desired.copy(this._target.position).setY(0).add(this._offset);
    // Interpolación exponencial: suave e independiente del framerate
    const t = 1 - Math.exp(-FOLLOW_SMOOTHNESS * dt);
    this.instance.position.lerp(this._desired, t);

    // Zoom suave hacia zoomTarget; la matriz de proyección solo se
    // recalcula mientras el zoom realmente está cambiando.
    const zoomDelta = this.zoomTarget - this.instance.zoom;
    if (Math.abs(zoomDelta) > 0.001) {
      this.instance.zoom += zoomDelta * (1 - Math.exp(-ZOOM_SMOOTHNESS * dt));
      this.instance.updateProjectionMatrix();
    }
  }
}
