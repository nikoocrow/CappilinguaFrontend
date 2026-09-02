import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import Experience from '../Experience.js';
import { GRID_DIM, chunkCenter } from './mapConfig.js';
import { RoadTile, roadLayout } from './roadLayout.js';
import { TILE_Y } from './Chunk.js';

// Orientación base de cada malla de road_tiles.glb, verificada visualmente
// en la escena de debug (paso 8.1 del handoff) en vez de asumida:
// - tile_road_straight sin rotación corre a lo largo del eje Z (N-S).
// - tile_road_curve sin rotación conecta el borde -Z con el borde +X. El
//   handoff asumía +Z; la conversión Y-up del exportador de Blender invirtió
//   ese signo, por eso hacía falta comprobarlo en vez de deducirlo.
// - tile_road_cross es simétrico en las cuatro orientaciones.
const MESH_NAME_BY_TYPE = {
  [RoadTile.STRAIGHT_NS]: 'tile_road_straight',
  [RoadTile.STRAIGHT_EW]: 'tile_road_straight',
  [RoadTile.CURVE]: 'tile_road_curve',
  [RoadTile.CROSS]: 'tile_road_cross',
};

const _matrix = new THREE.Matrix4();

// road_tiles_textured.glb no es un plano: tiene cordón/vereda modelado, con
// varias alturas locales (0, 0.02, 0.05, 0.063, 0.1, 0.107, 0.15) -- 0.15 es
// apenas el borde superior del cordón (poca área real, medida por
// triángulos: ~93-120 unidades² según el tile) y 0.02 es el ASFALTO en sí,
// la superficie plana más grande de las tres piezas por lejos (~125-256
// unidades²) y consistente entre straight/curve/cross. Un intento anterior
// alineó el borde del cordón (0.15) con el plano de los tiles (Chunk.js,
// TILE_Y) en vez del asfalto -- eso hundía la superficie real 0.115 por
// debajo de Floor.js (Y=0), invisible bajo el piso (se veía como un
// "agujero" en las intersecciones). Este offset baja el asfalto (0.02) a
// un pelo por encima de TILE_Y, no exactamente al mismo nivel, para no
// reabrir el z-fighting tile-vs-calle que motivó bajar los tiles.
const ROAD_ASPHALT_LOCAL_Y = 0.02;
const ROAD_SURFACE_DROP = TILE_Y + 0.005 - ROAD_ASPHALT_LOCAL_Y;

// Red de carreteras completa, fusionada en un único BufferGeometry (handoff
// §3/§7): con avenidas cada 3 celdas cargar todo de una vez es más barato
// que streamearlo, y da un solo draw call. Vive fuera del sistema de chunks
// a propósito — ChunkGrid.js y Chunk.js no se tocan ni saben que existe.
export default class RoadNetwork {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    const source = this.resources.items.roadTiles.scene;
    const meshByName = {
      tile_road_straight: source.getObjectByName('tile_road_straight'),
      tile_road_curve: source.getObjectByName('tile_road_curve'),
      tile_road_cross: source.getObjectByName('tile_road_cross'),
    };
    // Las tres mallas comparten un solo material (handoff §1): tomar
    // cualquiera de las tres alcanza para la fusionada.
    const material = meshByName.tile_road_cross.material;

    const parts = [];
    for (let cz = 0; cz < GRID_DIM; cz++) {
      for (let cx = 0; cx < GRID_DIM; cx++) {
        const cell = roadLayout[cz][cx];
        if (cell.type === RoadTile.NONE) continue;

        const center = chunkCenter(cx, cz);
        _matrix.makeRotationY(cell.rotation * (Math.PI / 2));
        _matrix.setPosition(center.x, 0, center.z);

        // Clon por celda: cada una necesita su propia posición/rotación
        // horneada en los vértices antes de fusionar todo en una sola
        // geometría (mergeGeometries no acepta transforms por instancia).
        const geometry = meshByName[MESH_NAME_BY_TYPE[cell.type]].geometry.clone();
        geometry.applyMatrix4(_matrix);
        parts.push(geometry);
      }
    }

    const merged = mergeGeometries(parts, false);
    for (const geometry of parts) geometry.dispose();

    this.mesh = new THREE.Mesh(merged, material);
    this.mesh.position.y = ROAD_SURFACE_DROP;
    this.mesh.receiveShadow = true;
    // Estática de punta a punta: matriz congelada, no se recompone por frame.
    this.mesh.updateMatrix();
    this.mesh.matrixAutoUpdate = false;
    this.scene.add(this.mesh);
  }
}
