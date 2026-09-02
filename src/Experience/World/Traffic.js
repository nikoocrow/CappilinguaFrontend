import * as THREE from 'three';
import Experience from '../Experience.js';
import { mainAvenueLoop } from './vehicleRoutes.js';

const LOOP_SECONDS = 24; // vuelta completa a velocidad base (1x), sin frenar
const SPEED_JITTER = 0.3; // velocidad libre por auto: ±15% de la base
// t inicial: completamente al azar por auto, no repartido parejo (t = i/N)
// con un jitter chico -- eso seguía leyéndose como "todos a la misma
// distancia" con variación menor. Al azar de verdad da gaps bien dispares
// (algunos autos casi pegados, otros con un tramo vacío grande), como el
// tránsito real. Dos autos pueden arrancar muy cerca -- no hace falta
// evitarlo: el car-following ya reordena por t y frena al que quedó atrás
// en el primer frame, se resuelve solo en vez de quedar pegado para siempre.

// Car following: por debajo de CAR_STOP_GAP el auto objetivo es velocidad 0;
// por encima de CAR_FREE_GAP, velocidad libre; lineal en el medio.
// CAR_STOP_GAP = un auto (~4-5m) más margen de seguridad -- es la distancia
// real a la que dos autos quedan circulando, no la distancia a la que
// llegan a tocarse.
const CAR_STOP_GAP = 7;
const CAR_FREE_GAP = 20;
// CAR_STOP_GAP/CAR_FREE_GAP de arriba son compartidos por toda la flota:
// cuando dos o más autos terminan yendo a la par (un "pelotón", que es
// justo lo que se ve en pantalla la mayor parte del tiempo, aunque a nivel
// de todo el loop los gaps estén bien repartidos gracias al t inicial al
// azar), todos convergen a EXACTAMENTE la misma distancia de seguimiento
// entre sí -- de ahí la sensación de "misma distancia" viendo un grupo de
// autos juntos. Este jitter les da a cada uno su propia distancia cómoda
// (±35%), como si cada auto tuviera su propio conductor más o menos
// apegado al de adelante.
const CAR_GAP_JITTER = 0.35;
// La velocidad no salta al valor objetivo de golpe: se interpola con la
// misma suavidad exponencial que ya usa Camera.js para zoom/follow, pero
// con dos constantes distintas -- frenar tiene que reaccionar rápido
// (seguridad: un obstáculo puede aparecer cerca), acelerar no. Con una
// sola constante rápida para ambos, el auto arrancaba de golpe apenas se
// despejaba el camino, nada realista.
const BRAKE_SMOOTHING = 4; // constante de tiempo ~0.25s
const ACCEL_SMOOTHING = 1; // constante de tiempo ~1s: arrancada gradual

// Frenado por obstáculo (jugador y NPCs): a diferencia del auto de
// adelante, un obstáculo no vive en la curva (no tiene t), así que se lo
// detecta proyectando su posición sobre el avance del auto (adelante/
// lateral, con producto punto) en vez de con un cono angular. Un cono
// angular se apaga solo a medida que el auto se acerca -salvo que el
// obstáculo esté justo en el eje de avance, el ángulo hacia él tiende a
// 90° al pasar al lado-, así que el auto frenaba a medias y nunca llegaba
// a pararse del todo (bug real, visto en juego). Con adelante/lateral por
// separado, "lateral" no cambia con la distancia: si el obstáculo está
// dentro del corredor, sigue detectado hasta pasarlo.
const OBSTACLE_LOOKAHEAD = 12; // metros, cuánto adelante se detecta
const OBSTACLE_HALF_WIDTH = 2.5; // metros, ancho del corredor a cada lado del auto
// Margen real entre el PARAGOLPES del auto y el obstáculo cuando frena del
// todo -- no un radio genérico restado del pivote. Antes la frenada
// apuntaba a una distancia calculada desde el pivote del auto, casi
// coincidente con donde el paragolpes (car.halfLength adelante del pivote)
// ya tocaba la caja de colisión del jugador: cualquier empujón de
// resolvePlayerPosition (o que speedFactor nunca llegue a un cero exacto)
// le abría al auto un huequito para avanzar, que volvía a empujar al
// jugador -- un ciclo de "arrastre" que nunca se asentaba. Midiendo desde
// el paragolpes con un margen real, frenar del todo deja una distancia
// visible de sobra antes de tocar la caja de colisión.
const OBSTACLE_CLEARANCE = 2;
// Umbrales de parada/libre propios del obstáculo, distintos de los del
// auto de adelante (ver por qué en update(): compartir un solo umbral
// entre "distancia a un auto" y "distancia a un obstáculo" es lo que
// hacía que la fila de autos se apilara toda en el mismo punto).
const OBSTACLE_STOP_GAP = 0; // effectiveGap ya resta paragolpes + margen
const OBSTACLE_FREE_GAP = 10;

// Mapea una distancia (metros) a un factor de velocidad 0-1: 0 en stopGap
// o más cerca, 1 en freeGap o más lejos, lineal en el medio.
function gapToFactor(gapMeters, stopGap, freeGap) {
  return THREE.MathUtils.clamp((gapMeters - stopGap) / (freeGap - stopGap), 0, 1);
}

// Lean en curvas: inclinación proporcional al yaw rate (cuán rápido gira
// el heading), calculado por diferencia finita frame a frame -- no hace
// falta conocer la curvatura de la ruta, así que sigue funcionando igual
// el día que haya cambios de carril con su propia curva de transición.
// El giro en punta (radio 2, ver vehicleRoutes.js) da un yaw rate enorme
// para una maniobra tan cerrada, así que el límite (MAX_LEAN) es el que
// hace el trabajo real; LEAN_GAIN solo importa para curvas suaves.
const LEAN_GAIN = 0.15;
const MAX_LEAN = THREE.MathUtils.degToRad(8);

// Cabeceo al frenar/acelerar: proporcional a la derivada de speedFactor.
const PITCH_GAIN = 0.5;
const MAX_PITCH = THREE.MathUtils.degToRad(4);

// 14 autos repartidos entre los 7 tipos del pack (2 cada uno). Los
// vehículos ya vienen como una malla + un material por tipo (no hace falta
// fusionar carrocería/ruedas/vidrios como advierte el handoff para el pack
// de ithappy).
//
// `scale` compensa el largo de cada modelo contra el radio del giro en
// punta de vehicleRoutes.js (radio 2): un cuerpo rígido centrado en un
// pivote que recorre un arco de radio R no se queda dentro de ±R -- sus
// esquinas, al girar, llegan a ±√((R±ancho/2)² + (largo/2)²). Para
// car_monster (el más largo y ancho del pack) eso supera el cordón
// (asfalto ±4) con escala 1: es la esquina que termina en la vereda.
// Los siete valores de acá son la escala "seguro" por tipo (deja esa
// esquina en ±3.7, con margen) ×1.3 (pedido explícito de agrandar la
// flota 30%): con eso, las siete esquinas vuelven a superar apenas el
// cordón durante el giro cerrado (~4.33-4.35) -- el auto pisa la vereda
// unos centímetros en la punta del loop, sabido y aceptado (mismo
// compromiso que ya se aceptó para van/pickup/hatchback).
//
// halfWidth/halfLength son las dimensiones reales medidas del .glb (sin
// escalar, bounding box exacto una vez corregida la rotación) -- se
// reusan para las cajas de colisión contra el jugador.
//
// `speedMultiplier` es la velocidad "de crucero" propia de cada tipo,
// aplicada antes del jitter ±15% de siempre (que sigue siendo por auto,
// no por tipo) -- para que no todos los autos vayan a la misma velocidad
// aunque sean de tipos distintos. Valores con algo de sentido temático:
// la van y el monster truck más lentos, el deportivo y el muscle car más
// rápidos. Es cosmético, no afecta el car-following (un auto rápido
// simplemente alcanza y hace fila detrás de uno lento, como ya pasa hoy
// con el jitter).
const FLEET = [
  { mesh: 'car_van', count: 2, scale: 0.85 * 1.3, halfWidth: 1.147, halfLength: 2.518, speedMultiplier: 0.85 },
  { mesh: 'car_pickup', count: 2, scale: 0.745 * 1.3, halfWidth: 1.257, halfLength: 3.022, speedMultiplier: 0.95 },
  { mesh: 'car_hatchback', count: 2, scale: 0.983 * 1.3, halfWidth: 1.008, halfLength: 2.216, speedMultiplier: 1.0 },
  { mesh: 'car_classic', count: 2, scale: 0.913 * 1.3, halfWidth: 1.011, halfLength: 2.483, speedMultiplier: 0.8 },
  { mesh: 'car_muscle', count: 2, scale: 0.953 * 1.3, halfWidth: 1.015, halfLength: 2.321, speedMultiplier: 1.15 },
  { mesh: 'car_sport', count: 2, scale: 0.915 * 1.3, halfWidth: 1.092, halfLength: 2.370, speedMultiplier: 1.25 },
  { mesh: 'car_monster', count: 2, scale: 0.700 * 1.3, halfWidth: 1.474, halfLength: 3.033, speedMultiplier: 0.75 },
];

// Punto 8.5 + car following: un InstancedMesh por tipo (no se puede mezclar
// geometrías distintas en un solo InstancedMesh) para el render, y una
// lista de rutas aparte para el orden/gap entre autos -- cada ruta es
// independiente, no se comparan autos de rutas distintas entre sí. Por
// ahora solo existe una ruta (mainAvenueLoop), pero el modelo ya soporta
// más sin tocar el loop principal.
export default class Traffic {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.resources = this.experience.resources;

    // Scratch reusado por frame y por auto (regla 2): nada de Vector3/
    // Object3D nuevos en update(), sin importar cuántos autos haya.
    this._dummy = new THREE.Object3D();
    this._point = new THREE.Vector3();
    this._tangent = new THREE.Vector3();
    this._currentPoint = new THREE.Vector3(); // posición pre-avance, para el chequeo de obstáculos
    // Ruedas: dummy y matriz aparte de this._dummy -- se combinan (auto ×
    // rueda) sin pisar la matriz del cuerpo que ya se está armando para el
    // mismo auto en el mismo frame (ver update()).
    this._wheelDummy = new THREE.Object3D();
    this._wheelMatrix = new THREE.Matrix4();
    // Comparador reusado: pasarlo a Array.sort no debe crear una función
    // nueva cada frame.
    this._byT = (a, b) => a.t - b.t;

    this.routes = [{ path: mainAvenueLoop, length: mainAvenueLoop.getLength(), cars: [] }];
    this.groups = this._buildFleet(this.routes[0]);

    if (this.experience.debug.active) this._buildDebugPaths();
  }

  // Visual de diagnóstico: una línea por sub-curva (recta +2, arco, recta
  // -2, arco), cada una de un color distinto -- el loop es una sola curva
  // cerrada que pasa dos veces por la misma franja de mundo (sube por un
  // carril, baja por el otro), y con un solo color es fácil comparar un
  // auto contra el segmento del carril que no le corresponde. Las esferas
  // celestes son los 4 puntos que se escribieron a mano en
  // vehicleRoutes.js (los extremos de cada recta/arco), para distinguir
  // "lo que yo definí" de "lo que interpola la curva". Solo detrás de
  // #debug (regla 12 del system-design).
  _buildDebugPaths() {
    this.debugGroup = new THREE.Group();
    this.debugGroup.position.y = 0.3; // por encima del asfalto, para verla
    this.scene.add(this.debugGroup);

    const pointGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    // recta +2 (rojo), arco norte (amarillo), recta -2 (azul), arco sur (amarillo)
    const curveColors = [0xff0000, 0xffff00, 0x2266ff, 0xffff00];

    for (const route of this.routes) {
      route.path.curves.forEach((curve, i) => {
        const pts = curve.getPoints(150);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: curveColors[i % curveColors.length], depthTest: false }));
        line.renderOrder = 999;
        this.debugGroup.add(line);

        // El inicio de esta sub-curva es uno de los 4 puntos escritos a
        // mano en vehicleRoutes.js (los LineCurve3 y los LaneArc comparten
        // esas mismas uniones).
        const p = curve.getPoint(0);
        const marker = new THREE.Mesh(pointGeometry, pointMaterial);
        marker.position.set(p.x, 0, p.z);
        this.debugGroup.add(marker);
      });
    }

    const folder = this.experience.debug.ui.addFolder('Tránsito');
    folder.add(this.debugGroup, 'visible').name('Ver rutas');

    // No hay un solo objeto con un `.visible` que cubra toda la flota (un
    // InstancedMesh de cuerpo + hasta 4 de ruedas por tipo): el checkbox
    // necesita su propio objeto plano y un onChange que recorra this.groups.
    const vehicleToggle = { visible: true };
    folder.add(vehicleToggle, 'visible').name('Ver vehículos').onChange((visible) => {
      for (const { instanced, wheelInstances } of this.groups) {
        instanced.visible = visible;
        if (wheelInstances) for (const wi of wheelInstances) wi.visible = visible;
      }
    });
  }

  // Todos los autos de la flota viajan hoy sobre la única ruta que existe:
  // se reparten con t al azar (ver comentario de más abajo) y quedan
  // registrados en route.cars para el cálculo de gaps, además de en su
  // InstancedMesh por tipo para el render.
  _buildFleet(route) {
    const source = this.resources.items.vehicles.scene;

    const groups = [];
    for (const { mesh: name, count, scale, halfWidth, halfLength, speedMultiplier } of FLEET) {
      const sourceMesh = source.getObjectByName(name);
      if (!sourceMesh) {
        // No tirar abajo todo World.js por una malla faltante en el .glb
        // (un nombre mal exportado desde Blender): mejor un tipo de auto
        // menos en la flota que un jugador y NPCs que nunca llegan a
        // crearse porque esto explotó a mitad del callback de 'ready'.
        console.warn(`Traffic: no se encontró la malla "${name}" en vehicles.glb, se salta ese tipo.`);
        continue;
      }
      const instanced = new THREE.InstancedMesh(sourceMesh.geometry, sourceMesh.material, count);
      instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // El culling automático de un InstancedMesh usa el bounding sphere de
      // la GEOMETRÍA BASE (unos metros, centrada en el origen del auto), no
      // el de las instancias reales -- que están repartidas a lo largo de
      // los ~370m del loop vía instanceMatrix. Con frustumCulled activo,
      // Three.js compara ese punto ficticio contra la cámara y culea el
      // InstancedMesh ENTERO (todos los autos de este tipo) en cuanto ese
      // punto queda fuera de vista, sin importar que instancias reales sí
      // estén en cuadro -- el bug de autos invisibles al hacer zoom.
      instanced.frustumCulled = false;
      this.scene.add(instanced);

      // Ruedas: 4 nodos HERMANOS del cuerpo (mismo origen que el auto, no
      // hijos -- ver prepare_vehicles.py), así que su `.position` ya es
      // directamente el offset local dentro del auto. Cada una mantiene SU
      // PROPIA geometría (no se comparte entre las 4: la malla de origen no
      // es simétrica al espejo -- rines, dibujo del neumático -- así que
      // compartir una sola dejaba el lado opuesto del auto con las caras
      // miradas para adentro, se veía negro por normales invertidas). Un
      // InstancedMesh por posición de rueda (4 por tipo) en vez de uno solo
      // para las 4: son 4 draw calls más por tipo, insignificante a esta
      // escala (regla 3 del system-design), y evita la malla compartida.
      const wheelNodes = [0, 1, 2, 3].map((i) => source.getObjectByName(`${name}_wheel_${i}`));
      let wheelInstances = null;
      let wheelOffsets = null;
      let wheelRadius = 0;
      if (wheelNodes.every(Boolean)) {
        wheelNodes[0].geometry.computeBoundingBox();
        // El disco de la rueda gira en el plano Y-Z (eje de giro = X local,
        // transversal al auto); su radio es la mitad de la altura de la
        // rueda, centrada en su propio origen (prepare_vehicles.py ya la
        // recentró ahí). Las 4 ruedas de un mismo auto miden prácticamente
        // igual, alcanza con medir la primera.
        const bbox = wheelNodes[0].geometry.boundingBox;
        wheelRadius = (bbox.max.y - bbox.min.y) / 2;

        wheelOffsets = wheelNodes.map((n) => n.position.clone());
        wheelInstances = wheelNodes.map((node) => {
          const inst = new THREE.InstancedMesh(node.geometry, node.material, count);
          inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          inst.frustumCulled = false; // mismo motivo que `instanced` arriba
          this.scene.add(inst);
          return inst;
        });
      } else {
        console.warn(`Traffic: "${name}" no tiene las 4 ruedas esperadas (${name}_wheel_0..3), se renderiza sin ruedas.`);
      }

      for (let index = 0; index < count; index++) {
        const t = Math.random();
        route.path.getPointAt(t, this._point);
        route.path.getTangentAt(t, this._tangent);
        const car = {
          t,
          baseSpeed: (1 / LOOP_SECONDS) * speedMultiplier * (1 - SPEED_JITTER / 2 + Math.random() * SPEED_JITTER),
          speedFactor: 1, // arranca a velocidad libre, se ajusta según el gap
          // Distancia de seguimiento propia de este auto (ver CAR_GAP_JITTER):
          // dos autos con el mismo baseSpeed relativo ya no convergen a la
          // misma distancia entre sí.
          carStopGap: CAR_STOP_GAP * (1 + (Math.random() * 2 - 1) * CAR_GAP_JITTER),
          carFreeGap: CAR_FREE_GAP * (1 + (Math.random() * 2 - 1) * CAR_GAP_JITTER),
          scale,
          // Media caja ya escalada, para el chequeo de colisión contra el
          // jugador (findPlayerCollision) -- no hace falta recalcularla
          // cada frame, `scale` es fijo por auto.
          halfWidth: halfWidth * scale,
          halfLength: halfLength * scale,
          instanced,
          index,
          // Ruedas de este auto (null si el tipo no las tiene): un array de
          // 4 InstancedMesh (uno por posición de rueda), compartidos entre
          // los `count` autos de este tipo -- cada auto usa su propio
          // `index`, igual que en el InstancedMesh del cuerpo.
          wheelInstances,
          wheelOffsets,
          wheelRadius,
          // Fase inicial al azar: si no, las ruedas de todos los autos de
          // un mismo tipo arrancan sincronizadas, visible en el loop.
          wheelSpin: Math.random() * Math.PI * 2,
          // Posición/heading actuales en el mundo, actualizados en update()
          // -- las consulta findPlayerCollision, llamado desde afuera
          // (World.js) después de mover al jugador, no durante este loop.
          worldX: this._point.x,
          worldZ: this._point.z,
          dirX: this._tangent.x,
          dirZ: this._tangent.z,
          // Estado para el lean/cabeceo: heading y speedFactor del frame
          // anterior, para sacar sus derivadas por diferencia finita.
          prevHeading: Math.atan2(this._tangent.x, this._tangent.z),
          prevSpeedFactor: 1,
        };
        route.cars.push(car);
      }

      groups.push({ instanced, wheelInstances });
    }

    return groups;
  }

  // `obstacles` son entidades con `.position` que un auto debe evitar --
  // el jugador y los NPCs, hoy (World.js arma el arreglo cada frame).
  // Traffic no guarda referencia, solo los consulta este frame, así que
  // nunca queda apuntando a un NPC ya despawneado.
  update(obstacles = []) {
    const dt = this.time.delta;

    for (const route of this.routes) {
      const cars = route.cars;
      cars.sort(this._byT); // orden por t: define quién es "el de adelante"
      const n = cars.length;

      for (let i = 0; i < n; i++) {
        const car = cars[i];
        const ahead = cars[(i + 1) % n];

        const gap = ahead === car ? 1 : (ahead.t - car.t + 1) % 1;
        const gapMeters = gap * route.length;

        // Posición/tangente antes de avanzar t: hace falta ya acá (no solo
        // para el render de más abajo) para medir distancia real a los
        // NPCs, que no tienen un t en la ruta.
        route.path.getPointAt(car.t, this._currentPoint);
        route.path.getTangentAt(car.t, this._tangent);

        let obstacleGapMeters = Infinity;
        for (const obstacle of obstacles) {
          const dx = obstacle.position.x - this._currentPoint.x;
          const dz = obstacle.position.z - this._currentPoint.z;

          // Adelante/lateral por separado (producto punto con la tangente y
          // con su perpendicular), no distancia+ángulo: "lateral" no se
          // achica con la distancia, así que el obstáculo sigue detectado
          // hasta pasarlo de verdad, no solo hasta acercarse.
          const forwardDist = dx * this._tangent.x + dz * this._tangent.z;
          if (forwardDist <= 0 || forwardDist > OBSTACLE_LOOKAHEAD) continue;

          const lateralDist = Math.abs(dx * -this._tangent.z + dz * this._tangent.x);
          if (lateralDist > OBSTACLE_HALF_WIDTH) continue;

          // Desde el paragolpes (car.halfLength adelante del pivote), no
          // desde el pivote -- ver el porqué en el comentario de
          // OBSTACLE_CLEARANCE.
          const effectiveGap = forwardDist - car.halfLength - OBSTACLE_CLEARANCE;
          if (effectiveGap < obstacleGapMeters) obstacleGapMeters = effectiveGap;
        }

        // Cada tipo de gap se mapea a un factor con SU PROPIO umbral de
        // parada antes de combinarse -- no se puede promediar/combinar las
        // distancias crudas primero. Si un auto de adelante ya está
        // detenido justo frente a un obstáculo, la distancia de un segundo
        // auto a "el auto de adelante" y su distancia directa "al mismo
        // obstáculo" terminan siendo casi el mismo número (la del auto de
        // adelante es la del obstáculo menos lo que ya avanzó ese auto), así
        // que si ambas usaran el mismo umbral de parada, el segundo auto
        // apuntaría a detenerse en el mismo punto que el primero en vez de
        // guardar distancia -- eso era el apilamiento/solapamiento.
        const carFactor = gapToFactor(gapMeters, car.carStopGap, car.carFreeGap);
        const obstacleFactor = gapToFactor(obstacleGapMeters, OBSTACLE_STOP_GAP, OBSTACLE_FREE_GAP);
        const targetFactor = Math.min(carFactor, obstacleFactor);

        const smoothing = targetFactor < car.speedFactor ? BRAKE_SMOOTHING : ACCEL_SMOOTHING;
        car.speedFactor += (targetFactor - car.speedFactor) * (1 - Math.exp(-smoothing * dt));

        car.t = (car.t + car.baseSpeed * car.speedFactor * dt) % 1;

        route.path.getPointAt(car.t, this._point);
        route.path.getTangentAt(car.t, this._tangent);

        // Yaw rate por diferencia finita del heading (mismo truco de
        // Player.js para envolver el ángulo a [-π, π] antes de dividir por
        // dt) y derivada de speedFactor, para el lean/cabeceo de abajo.
        const heading = Math.atan2(this._tangent.x, this._tangent.z);
        let dHeading = heading - car.prevHeading;
        dHeading = Math.atan2(Math.sin(dHeading), Math.cos(dHeading));
        const yawRate = dt > 0 ? dHeading / dt : 0;
        car.prevHeading = heading;

        const speedDelta = dt > 0 ? (car.speedFactor - car.prevSpeedFactor) / dt : 0;
        car.prevSpeedFactor = car.speedFactor;

        const roll = THREE.MathUtils.clamp(yawRate * LEAN_GAIN, -MAX_LEAN, MAX_LEAN);
        const pitch = THREE.MathUtils.clamp(speedDelta * PITCH_GAIN, -MAX_PITCH, MAX_PITCH);

        this._dummy.position.copy(this._point);
        // Sumar la tangente (handoff §6): Object3D.lookAt pone +Z -no -Z-
        // apuntando al target en cualquier objeto que no sea Camera/Light
        // (ver Object3D.js), y car_* tiene el frente modelado en +Z local.
        this._dummy.lookAt(this._point.x + this._tangent.x, this._point.y + this._tangent.y, this._point.z + this._tangent.z);
        // Lean/cabeceo relativos a la orientación que acaba de fijar
        // lookAt: rotateX/rotateZ giran en espacio local, sobre los ejes
        // propios del auto (X = transversal -> cabeceo, Z = de avance ->
        // inclinación en curva), no sobre los ejes del mundo.
        this._dummy.rotateX(pitch);
        this._dummy.rotateZ(roll);
        this._dummy.scale.setScalar(car.scale);
        this._dummy.updateMatrix();

        car.instanced.setMatrixAt(car.index, this._dummy.matrix);

        // Ruedas: cada una es (matriz del auto) × (offset local + giro
        // propio en X) -- multiplicar del lado del auto hace que el offset
        // y el giro hereden su posición, orientación (incluida la
        // inclinación en curva) y escala, sin tener que recalcularlas acá.
        // Un solo ángulo de giro por auto para las 4 ruedas (no distingue
        // delantera de trasera, simplificación consciente).
        if (car.wheelInstances) {
          const linearSpeed = car.baseSpeed * car.speedFactor * route.length;
          // car.wheelRadius se midió sobre la geometría sin escalar -- el
          // radio real "en pantalla" (el que toca el asfalto) es ese ×
          // car.scale, así que hay que escalarlo acá para que la rueda no
          // gire de más/de menos respecto a lo que se ve.
          car.wheelSpin += (linearSpeed / (car.wheelRadius * car.scale)) * dt;

          for (let w = 0; w < 4; w++) {
            this._wheelDummy.position.copy(car.wheelOffsets[w]);
            this._wheelDummy.rotation.set(car.wheelSpin, 0, 0);
            this._wheelDummy.updateMatrix();
            this._wheelMatrix.multiplyMatrices(this._dummy.matrix, this._wheelDummy.matrix);
            car.wheelInstances[w].setMatrixAt(car.index, this._wheelMatrix);
          }
        }

        // Guardado para findPlayerCollision, consultado desde World.js
        // después de este update() (ver ahí el porqué del orden).
        car.worldX = this._point.x;
        car.worldZ = this._point.z;
        car.dirX = this._tangent.x;
        car.dirZ = this._tangent.z;
      }
    }

    for (const { instanced, wheelInstances } of this.groups) {
      instanced.instanceMatrix.needsUpdate = true;
      if (wheelInstances) for (const wi of wheelInstances) wi.instanceMatrix.needsUpdate = true;
    }
  }

  // Caja orientada por auto, expandida por `radius` (el jugador se trata
  // como un punto con margen, no como su propia caja -- alcanza para esto
  // y es más simple). Devuelve {x, z} corregido: si el punto cae dentro de
  // la caja de algún auto, lo empuja hacia afuera por el eje (adelante o
  // lateral) que necesite menos corrección -- el mismo efecto que "deslizar
  // contra el costado", pero sin la falla de la versión anterior
  // (chequear antes de moverse no alcanza: si el auto frena y su caja
  // termina apenas superpuesta con el jugador quieto, el jugador arranca
  // el frame YA adentro, y no había forma de salir -- quedaba atorado para
  // siempre). Resolver la penetración en vez de solo prevenirla se
  // autocorrige en cualquier frame, esté el jugador afuera, entrando, o ya
  // adentro. Se llama desde World.js después de traffic.update(), con la
  // posición ya movida del jugador este frame.
  resolvePlayerPosition(x, z, radius) {
    for (const route of this.routes) {
      for (const car of route.cars) {
        const dx = x - car.worldX;
        const dz = z - car.worldZ;

        const forward = dx * car.dirX + dz * car.dirZ;
        const forwardLimit = car.halfLength + radius;
        if (Math.abs(forward) > forwardLimit) continue;

        const lateral = dx * -car.dirZ + dz * car.dirX;
        const lateralLimit = car.halfWidth + radius;
        if (Math.abs(lateral) > lateralLimit) continue;

        // Adentro de la caja: empujar por el eje con menos penetración
        // (el truco estándar de resolución de colisiones -- produce el
        // desplazamiento más corto posible para salir).
        const forwardPenetration = forwardLimit - Math.abs(forward);
        const lateralPenetration = lateralLimit - Math.abs(lateral);

        if (lateralPenetration < forwardPenetration) {
          const push = (lateral < 0 ? -1 : 1) * lateralPenetration;
          x += -car.dirZ * push;
          z += car.dirX * push;
        } else {
          const push = (forward < 0 ? -1 : 1) * forwardPenetration;
          x += car.dirX * push;
          z += car.dirZ * push;
        }
      }
    }
    return { x, z };
  }
}
