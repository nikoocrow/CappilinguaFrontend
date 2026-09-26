import * as THREE from 'three';
import Experience from './Experience.js';

export const FRUSTUM_SIZE = 20;
const ISO_DISTANCE = 30;
const FOLLOW_SMOOTHNESS = 4;
const ZOOM_SMOOTHNESS = 4;

// Eje de la rotación orbital (ver rotateBy): constante a nivel de módulo,
// nunca se reasigna, así que no hace falta clonarlo por instancia.
const Y_AXIS = new THREE.Vector3(0, 1, 0);

// Ángulo orbital con el que arranca la cámara (además del isométrico base):
// un cuarto de vuelta para encarar la calle del blockout de frente en vez
// del ángulo isométrico original. Sigue siendo el mismo plano isométrico
// (la elevación no cambia), solo cambia desde qué lado se lo mira.
const INITIAL_ANGLE = Math.PI / 2;

export default class Camera {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;

    this._target = null;
    this._desired = new THREE.Vector3();
    this._offset = new THREE.Vector3();
    // Offset isométrico original, sin rotar: rotateBy() siempre parte de acá
    // para no acumular error de punto flotante rotando el offset ya rotado.
    this._baseOffset = new THREE.Vector3();
    // Ángulo orbital acumulado (drag de mouse / Q-E), sumado al ángulo
    // isométrico base. 0 = vista isométrica original.
    this._angle = 0;

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

    // Ángulo isométrico: 45° en Y (sigue siendo el mismo giro), elevación
    // más baja que el isométrico "verdadero" (35.26°) para acercarse a la
    // referencia de arte (ciudad estilo diorama, más frontal/de fachada que
    // de techo) — sigue siendo un único ángulo fijo, no rotación libre.
    const d = ISO_DISTANCE;
    this._baseOffset.set(d, d * Math.tan(THREE.MathUtils.degToRad(28)) * Math.SQRT2, d);
    this.rotateBy(INITIAL_ANGLE); // arranca ya orbitada a INITIAL_ANGLE
    this.instance.position.copy(this._offset);
    this.instance.lookAt(0, 0, 0);

    this.scene.add(this.instance);
  }

  // Excepción documentada a la regla "cámara fija sin rotación libre" del
  // system-design: Input.js la llama desde el drag de mouse y desde Q/E
  // para orbitar alrededor del jugador sin salir del plano isométrico (la
  // elevación no cambia, solo el heading). Rota el offset base sobre Y y
  // dispara update()/setTarget() a reacomodar la cámara con el nuevo offset.
  rotateBy(deltaAngle) {
    this._angle += deltaAngle;
    this._offset.copy(this._baseOffset).applyAxisAngle(Y_AXIS, this._angle);
  }

  // La cámara conserva su desplazamiento respecto al objetivo y se traslada
  // para seguirlo; con rotateBy() el offset ya no es fijo, así que además
  // hay que reorientarla hacia el objetivo (antes alcanzaba con la
  // orientación fija de setInstance, porque el offset nunca cambiaba).
  setTarget(object3D) {
    this._target = object3D;
    // Saltar de una al objetivo en vez de interpolar: si el jugador arranca
    // lejos del origen (posición restaurada al volver a la pantalla), sin
    // esto la cámara haría un viaje de un segundo hasta alcanzarlo.
    this._desired.copy(object3D.position).setY(0).add(this._offset);
    this.instance.position.copy(this._desired);
    this.instance.lookAt(object3D.position.x, 0, object3D.position.z);
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
    // Reorientar cada frame hacia el objetivo (ver rotateBy): con el offset
    // rotable, lookAt no puede fijarse una sola vez como antes.
    this.instance.lookAt(this._target.position.x, 0, this._target.position.z);

    // Zoom suave hacia zoomTarget; la matriz de proyección solo se
    // recalcula mientras el zoom realmente está cambiando.
    const zoomDelta = this.zoomTarget - this.instance.zoom;
    if (Math.abs(zoomDelta) > 0.001) {
      this.instance.zoom += zoomDelta * (1 - Math.exp(-ZOOM_SMOOTHNESS * dt));
      this.instance.updateProjectionMatrix();
    }
  }
}
