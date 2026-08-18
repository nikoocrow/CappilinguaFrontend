// Configuración del personaje compartida entre el juego principal (Player.js)
// y la pantalla de personalización (src/Customize). El glb trae todas las
// variantes de ropa/pelo/accesorios como mallas separadas sobre un mismo
// esqueleto (ver system-design.md); acá se listan sus nombres agrupados por
// "slot" para poder alternarlas, y se define cómo se persiste la elección.

export const CHARACTER_MODEL_SOURCE = {
  name: 'characterModel',
  type: 'gltfModel',
  path: '/characters/Creative_Characters_Free_glb/Creative_Character_free.glb',
};

export const IDLE_ANIMATION_SOURCE = {
  name: 'idleAnimation',
  type: 'fbx',
  path: '/characters/animations/Idle.fbx',
};

// Malla del cuerpo base: siempre visible, es la que recibe el tinte de piel.
export const BODY_MESH_NAME = 'Body_010';

// Cada slot es mutuamente excluyente entre sus opciones (a lo sumo una malla
// visible a la vez). `mesh: null` es la opción "nada" para slots opcionales.
export const OUTFIT_SLOTS = [
  {
    key: 'hair',
    label: 'Pelo',
    options: [
      { label: 'Corto', mesh: 'Hairstyle_male_010' },
      { label: 'Largo', mesh: 'Hairstyle_male_012' },
    ],
  },
  {
    key: 'face',
    label: 'Expresión',
    options: [
      { label: 'Neutral', mesh: 'Male_emotion_usual_001' },
      { label: 'Feliz', mesh: 'Male_emotion_happy_002' },
      { label: 'Enojado', mesh: 'Male_emotion_angry_003' },
    ],
  },
  {
    key: 'top',
    label: 'Torso',
    options: [
      { label: 'Remera', mesh: 'T_Shirt_009' },
      { label: 'Abrigo A', mesh: 'Outerwear_029' },
      { label: 'Abrigo B', mesh: 'Outerwear_036' },
      { label: 'Disfraz A', mesh: 'Costume_10_001' },
      { label: 'Disfraz B', mesh: 'Costume_6_001' },
    ],
  },
  {
    key: 'bottom',
    label: 'Piernas',
    options: [
      { label: 'Pantalón', mesh: 'Pants_010' },
      { label: 'Cargo', mesh: 'Pants_014' },
      { label: 'Short', mesh: 'Shorts_003' },
    ],
  },
  {
    key: 'socks',
    label: 'Medias',
    options: [
      { label: 'Sin medias', mesh: null },
      { label: 'Medias', mesh: 'Socks_008' },
    ],
  },
  {
    key: 'shoes',
    label: 'Calzado',
    options: [
      { label: 'Zapatillas', mesh: 'Shoe_Sneakers_009' },
      { label: 'Ojotas A', mesh: 'Shoe_Slippers_002' },
      { label: 'Ojotas B', mesh: 'Shoe_Slippers_005' },
    ],
  },
  {
    key: 'gloves',
    label: 'Guantes',
    options: [
      { label: 'Sin guantes', mesh: null },
      { label: 'Guantes A', mesh: 'Gloves_006' },
      { label: 'Guantes B', mesh: 'Gloves_014' },
    ],
  },
  {
    key: 'hat',
    label: 'Sombrero',
    options: [
      { label: 'Sin sombrero', mesh: null },
      { label: 'Gorra', mesh: 'Hat_010' },
      { label: 'Sombrero A', mesh: 'Hat_049' },
      { label: 'Sombrero B', mesh: 'Hat_057' },
    ],
  },
  {
    key: 'glasses',
    label: 'Anteojos',
    options: [
      { label: 'Sin anteojos', mesh: null },
      { label: 'Anteojos A', mesh: 'Glasses_004' },
      { label: 'Anteojos B', mesh: 'Glasses_006' },
    ],
  },
  {
    key: 'extra',
    label: 'Accesorio',
    options: [
      { label: 'Ninguno', mesh: null },
      { label: 'Bigote A', mesh: 'Moustache_001' },
      { label: 'Bigote B', mesh: 'Moustache_002' },
      { label: 'Nariz payaso', mesh: 'Clown_nose_001' },
      { label: 'Auriculares', mesh: 'Headphones_002' },
      { label: 'Chupete', mesh: 'Pacifier_001' },
    ],
  },
];

// Paleta de tonos de piel: "Original" no aplica tinte (blanco = factor 1,1,1
// sobre la textura, ver Player.js/CharacterStage.js). El resto son colores
// que se multiplican contra la textura del cuerpo (mismo truco que un dye
// de ropa), así que conservan el sombreado/AO ya horneado en el atlas.
export const SKIN_TONES = [
  { label: 'Original', color: '#ffffff' },
  { label: 'Claro', color: '#f2caa0' },
  { label: 'Medio', color: '#c98a56' },
  { label: 'Oscuro', color: '#8a5327' },
  { label: 'Muy oscuro', color: '#4d2f1a' },
];

const STORAGE_KEY = 'cappilingua:character';

// Coincide con el outfit fijo que tenía Player.js antes de esta pantalla
// (VISIBLE_MESH_NAMES), para que nada cambie visualmente por defecto.
const DEFAULT_SELECTION = {
  hair: 'Hairstyle_male_010',
  face: 'Male_emotion_usual_001',
  top: 'T_Shirt_009',
  bottom: 'Pants_010',
  socks: 'Socks_008',
  shoes: 'Shoe_Sneakers_009',
  gloves: null,
  hat: null,
  glasses: null,
  extra: null,
};

const DEFAULT_SKIN_COLOR = '#ffffff';

export function defaultCharacterConfig() {
  return { selection: { ...DEFAULT_SELECTION }, skinColor: DEFAULT_SKIN_COLOR };
}

export function loadCharacterConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCharacterConfig();

    const parsed = JSON.parse(raw);
    return {
      selection: { ...DEFAULT_SELECTION, ...parsed.selection },
      skinColor: parsed.skinColor || DEFAULT_SKIN_COLOR,
    };
  } catch {
    return defaultCharacterConfig();
  }
}

export function saveCharacterConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// Nombres de malla que deben quedar visibles para una selección dada
// (sin incluir BODY_MESH_NAME, que siempre está presente aparte).
export function visibleMeshNamesFor(selection) {
  return new Set(Object.values(selection).filter(Boolean));
}
