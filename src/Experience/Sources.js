import { CHARACTER_MODEL_SOURCE, IDLE_ANIMATION_SOURCE } from './World/characterConfig.js';

export default [
  CHARACTER_MODEL_SOURCE,
  IDLE_ANIMATION_SOURCE,
  {
    name: 'walkAnimation',
    type: 'fbx',
    path: '/characters/animations/Walking.fbx',
  },
  {
    name: 'runAnimation',
    type: 'fbx',
    path: '/characters/animations/Running.fbx',
  },
  // Blockout de Blender (calle de prueba): el .glb trae sus texturas
  // embebidas (piso incluido), GLTFLoader las carga solas, sin fuentes
  // sueltas que declarar acá.
  {
    name: 'streetBlockout',
    type: 'gltfModel',
    path: '/gbls/seul-street-4.glb',
  },
];
