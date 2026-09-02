import * as THREE from 'three';
import { GRID_DIM, chunkCenter } from './mapConfig.js';

// Los carriles son datos, no se derivan de la geometría de RoadNetwork.js
// (handoff §6). Acá se define UNA vez la forma del loop; Traffic.js solo la
// evalúa en getPointAt(t)/getTangentAt(t) por cada auto, nunca raycastea
// contra la malla de la carretera.
const LANE_OFFSET = 2; // eje de carril a ±2 del centro del tile (handoff §6)
const AVENUE_COLUMN = 5; // una de las avenidas N-S de roadLayout.js (índices 2, 5, 8)

const x0 = chunkCenter(AVENUE_COLUMN, 0).x;
const zMin = chunkCenter(AVENUE_COLUMN, 0).z;
const zMax = chunkCenter(AVENUE_COLUMN, GRID_DIM - 1).z;

// Arco de radio fijo en el plano XZ (piso del mundo). THREE.EllipseCurve
// vive en XY; para el suelo hace falta esta versión mínima.
class LaneArc extends THREE.Curve {
  constructor(center, radius, angleStart, angleEnd) {
    super();
    this.center = center;
    this.radius = radius;
    this.angleStart = angleStart;
    this.angleEnd = angleEnd;
  }

  getPoint(t, target = new THREE.Vector3()) {
    const angle = this.angleStart + (this.angleEnd - this.angleStart) * t;
    return target.set(
      this.center.x + this.radius * Math.cos(angle),
      0,
      this.center.z + this.radius * Math.sin(angle)
    );
  }
}

// Loop cerrado sobre una sola avenida: sube por el carril derecho (+Z,
// circulación por la derecha), gira en la punta norte, baja por el
// izquierdo (-Z) y gira en la punta sur. Los giros son arcos de radio
// exacto LANE_OFFSET -- no un CatmullRomCurve3 con una reversa de 180° en
// un solo punto, que sobrepasa esa distancia por diseño (un spline no
// puede acotarse a un radio exacto, solo aproximarlo): con puntos
// intermedios en la punta se llegó a probar hasta |x-x0| ≈ 2.87, y ese
// exceso -el auto "montado sobre la línea de borde"- era justamente el
// bug reportado. Con estos arcos, |x-x0| nunca pasa de 2 (verificado
// numéricamente). Tangentes continuas en las cuatro juntas.
function buildMainAvenueLoop() {
  const path = new THREE.CurvePath();

  path.add(new THREE.LineCurve3(
    new THREE.Vector3(x0 + LANE_OFFSET, 0, zMin),
    new THREE.Vector3(x0 + LANE_OFFSET, 0, zMax)
  ));
  path.add(new LaneArc(new THREE.Vector3(x0, 0, zMax), LANE_OFFSET, 0, Math.PI));
  path.add(new THREE.LineCurve3(
    new THREE.Vector3(x0 - LANE_OFFSET, 0, zMax),
    new THREE.Vector3(x0 - LANE_OFFSET, 0, zMin)
  ));
  path.add(new LaneArc(new THREE.Vector3(x0, 0, zMin), LANE_OFFSET, Math.PI, Math.PI * 2));

  return path;
}

export const mainAvenueLoop = buildMainAvenueLoop();
