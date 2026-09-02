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
  {
    name: 'roadTiles',
    type: 'gltfModel',
    path: '/city/streets/road_tiles_textured.glb',
  },
  {
    name: 'vehicles',
    type: 'gltfModel',
    path: '/city/vehicles.glb',
  },
];
