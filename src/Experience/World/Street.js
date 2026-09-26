import * as THREE from 'three';
import Experience from '../Experience.js';

// Igual que los placeholders de Chunk.js: Floor.js es la capa lógica de
// raycasting, siempre plana en y=0. Todo contenido visual que se apoye
// sobre ella se separa una fracción mínima para no z-fightear con su
// material (mismo offset que usa Chunk.js por la misma razón).
const GROUND_OFFSET = 0.015;

// Margen mínimo para que 'Suelo' quede por encima de 'Plane' (ver
// _lowerGroundToLevel/_lowerRoadToGroundLevel) sin z-fighting entre ambos.
const GROUND_TOP_MARGIN = 0.005;

// Altura final del nivel de piso una vez corregido 'Suelo' (ver
// _lowerGroundToLevel) — es la referencia que usa _restPropsOnGround para
// asentar el resto de los nodos (edificios, postes, bancos, árboles).
// Exportada porque es también la superficie visible más alta del blockout:
// cualquier cosa que deba verse por encima de la calle (ver TargetMarker.js)
// necesita este valor como piso, no el y=0 de Floor.js.
export const GROUND_TOP = GROUND_OFFSET + 0.02 + GROUND_TOP_MARGIN;

// El blockout vino exportado con una orientación corrida respecto al resto
// del mundo: se corrige acá en vez de re-exportar el .glb. Los Cube.xxx del
// blockout están sin rotación local (identidad) en el archivo original, así
// que un múltiplo de 90° los deja perfectamente paralelos a los bordes de
// los chunks (mapConfig.js) — es la única rotación que realmente alinea la
// calle con la grilla en vez de dejarla en diagonal.
const ROTATION_Y = -Math.PI / 2;

// 'Plane' (la calzada, material 'Carretera' con texturas PBR reales) viene
// del export ~0.29 unidades por debajo de 'Suelo' (la vereda), como un
// cordón real. Con la cámara mirando desde arriba, esto hace que 'Suelo' la
// tape casi por completo — se ve la textura cargada en devtools pero nunca
// en pantalla. La causa más probable: en Blender un modifier le corta un
// hueco a 'Suelo' por donde pasa la calzada (por eso ahí se ve bien), pero
// ese corte no se aplicó antes de exportar, así que el .glb trae 'Suelo'
// como una plancha sólida sin el hueco — la solución real es esa (recortar y
// reexportar). Mientras tanto se corrige en runtime bajándola al nivel de
// GROUND_OFFSET (el mismo piso base que usan los tiles de Chunk.js), en vez
// de emparejarla con la altura de 'Suelo': queda por debajo de la vereda
// (no exactamente al ras, más fiel a cómo se ve un cordón real) y la
// distancia real ya alcanza para que gane el z-test contra 'Suelo' sin
// z-fighting (ver _lowerRoadToGroundLevel) — a diferencia de un hundimiento
// más chico, que sí generaba parpadeo justo en el borde curvo entre ambas.

// Nodos de nivel superior que no deben convertirse en colisionadores porque
// su huella cubre gran parte del mapa (si no, bloquearían todo lo que
// representan en vez de solo delimitar un obstáculo puntual):
// - 'Suelo': el piso del blockout.
// - 'Plane': la calzada (material 'Carretera'), agregada en la actualización
//   del .glb — cubre casi toda el área jugable. Sin esta exclusión, el
//   jugador queda "dentro" de un collider en casi cualquier punto del mapa,
//   lo que dispara el escape-hatch de Player._moveWithCollisions() (no
//   bloquear cuando ya está parado sobre un collider) y desactiva las
//   colisiones contra los edificios en todo el mapa, no solo en la calzada.
const NON_COLLIDER_NAMES = new Set(['Suelo', 'Plane']);

// 'Personaje': cubo sin material, del tamaño de una persona parada cerca del
// origen — quedó del blockout de Blender como referencia de escala, no es
// contenido del nivel. Se excluye de la escena directamente (ni se ve ni
// colisiona), a diferencia de NON_COLLIDER_NAMES que sigue mostrando el nodo.
const EXCLUDED_NODE_NAMES = new Set(['Personaje']);

// Varios Cube.xxx del blockout (los edificios) no tienen material asignado
// en el .glb de origen. Sin material, el spec de glTF obliga a usar un
// default que es 100% metálico (metalness=1, roughness=1, sin textura) —
// sin un environment map en la escena eso no tiene nada que reflejar salvo
// el specular directo del sol, así que se ve negro puro en vez de gris de
// sombra. No es una sombra: es ese material "fantasma". Se lo reemplaza acá
// por un gris neutro no metálico (regla 3: material compartido a nivel de
// módulo, no uno por mesh).
const FALLBACK_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xb0b4bb, roughness: 0.85 });

function isUnauthoredGltfDefault(material) {
  return material.isMeshStandardMaterial && material.metalness === 1 && material.roughness === 1 && !material.map;
}

// Blockout de Blender de la calle: un único .glb con geometría y texturas
// (incluida la del piso) embebidas, así que no hay fuentes sueltas que
// cargar aparte (ver Sources.js/Resources.js). Se agrega tal cual a la
// escena, junto al resto de los personajes.
export default class Street {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.setModel();
  }

  setModel() {
    this.model = this.resources.items.streetBlockout.scene;
    this.model.position.y += GROUND_OFFSET;
    this.model.rotation.y = ROTATION_Y;

    // Sacar los nodos excluidos antes de agregar el modelo a la escena: así
    // ni se renderizan ni entran al traverse de sombras/materiales ni a
    // _buildColliders() (que solo mira this.model.children).
    for (const child of [...this.model.children]) {
      if (EXCLUDED_NODE_NAMES.has(child.name)) this.model.remove(child);
    }

    this.model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      if (Array.isArray(child.material)) {
        child.material = child.material.map((m) => (isUnauthoredGltfDefault(m) ? FALLBACK_MATERIAL : m));
      } else if (isUnauthoredGltfDefault(child.material)) {
        child.material = FALLBACK_MATERIAL;
      }
    });

    this.scene.add(this.model);
    // Fuerza el recálculo de matrixWorld antes de leer bounding boxes: recién
    // se agregó a la escena, y _buildColliders() necesita la rotación ya
    // reflejada en los hijos (a diferencia del offset de Y, la rotación sí
    // cambia X/Z, así que un matrixWorld desactualizado rompería los AABB).
    this.model.updateMatrixWorld(true);
    this._lowerGroundToLevel();
    this._lowerRoadToGroundLevel();
    this._restPropsOnGround();
    this.colliders = this._buildColliders();
  }

  // 'Suelo' viene con una traslación local que varió sin aviso entre exports
  // del blockout (0.02 en un archivo, ~0.7-0.8 en el siguiente) — nada
  // garantiza que el archivo la deje al nivel del piso, así que no hay que
  // confiar en el valor que traiga. Se normaliza acá al mismo criterio que
  // _lowerRoadToGroundLevel: justo encima de donde termina 'Plane' (que se
  // fija en GROUND_OFFSET + 0.02 más abajo), para que la vereda gane el
  // z-test contra la calzada sin depender de la altura del export.
  _lowerGroundToLevel() {
    const ground = this.model.getObjectByName('Suelo');
    if (!ground) return;

    const groundTop = new THREE.Box3().setFromObject(ground).max.y;
    ground.position.y += GROUND_TOP - groundTop;
  }

  // El resto de los nodos de nivel superior (edificios 'Cube.xxx', postes,
  // bancos, árboles, 'soporte') traen su propia altura baked en el .glb, y
  // esa altura varió de exporte a exporte de forma NO uniforme — no es el
  // mismo delta que 'Suelo' (algunos subieron ~0.8, otros ~0.6, algún Cube
  // mucho más), así que no alcanza con aplicarles la misma corrección que a
  // 'Suelo'. Se asienta cada uno por separado: se mide su punto más bajo en
  // mundo y se lo desplaza lo justo para que apoye sobre GROUND_TOP, sin
  // tocar 'Suelo' ni 'Plane' (ya corregidos arriba con su propio criterio).
  _restPropsOnGround() {
    const box = new THREE.Box3();

    for (const child of this.model.children) {
      if (child.name === 'Suelo' || child.name === 'Plane') continue;

      box.setFromObject(child);
      if (box.isEmpty()) continue;

      child.position.y += GROUND_TOP - box.min.y;
    }
  }

  // Ver comentario junto a la declaración de 'Plane' más arriba.
  _lowerRoadToGroundLevel() {
    const road = this.model.getObjectByName('Plane');
    if (!road) return;

    const roadTop = new THREE.Box3().setFromObject(road).max.y;
    // GROUND_OFFSET + un epsilon extra (no exactamente GROUND_OFFSET): a esa
    // altura coincide con los tiles de Chunk.js y quedan coplanares. Un
    // polygonOffset de rasterizado para desempatar tuvo z-fighting
    // intermitente según el zoom/ángulo de cámara (GPU-dependiente); una
    // separación real, aunque chica, es el mismo criterio que ya usa
    // GROUND_OFFSET para separarse de Floor.js, y no depende de eso.
    road.position.y += GROUND_OFFSET + 0.02 - roadTop;
  }

  // Colisionadores estáticos y planos (rectángulos en XZ, se ignora la
  // altura): un AABB en mundo por cada nodo de nivel superior del blockout,
  // calculado una sola vez al cargar (no por frame, así que el allocation
  // acá no viola la regla 2 — la consumen Player/Npc por frame como simples
  // números, sin instanciar nada de Three.js).
  _buildColliders() {
    const box = new THREE.Box3();
    const colliders = [];

    for (const child of this.model.children) {
      if (NON_COLLIDER_NAMES.has(child.name)) continue;

      box.setFromObject(child);
      if (box.isEmpty()) continue;

      colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
    }

    return colliders;
  }
}
