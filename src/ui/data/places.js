/* Lugares de Seúl y sus categorías (handoff § Mapa de la ciudad).
   `top`/`left` son porcentajes sobre el área de contenido: mientras el mapa
   sea la escena de three.js sin coordenadas de mundo para estos lugares, los
   pines viven como overlay HTML anclado a puntos conocidos (nota 2 del
   handoff). Cuando existan posiciones 3D reales, se reemplazan estos
   porcentajes por una proyección con camera.project(). */

export const CATEGORIES = [
  { id: 'todos', label: 'Todos', color: '#c4a6ff', glyph: '📍' },
  { id: 'cultura', label: 'Cultura', color: '#ef4d6d', glyph: '⛩' },
  { id: 'compras', label: 'Compras', color: '#f5c451', glyph: '🛍' },
  { id: 'ocio', label: 'Ocio', color: '#9b6bff', glyph: '🎤' },
  { id: 'naturaleza', label: 'Naturaleza', color: '#4fb3a8', glyph: '🌿' },
];

export const PLACES = [
  {
    id: 'tower',
    name: 'N Seoul Tower',
    korean: '남산서울타워',
    category: 'cultura',
    top: 21,
    left: 23.5,
    stars: 6,
    starsMax: 12,
    locked: false,
    description: 'Mirador sobre la ciudad y los candados del amor en Namsan.',
  },
  {
    id: 'gangnam',
    name: 'Gangnam',
    korean: '강남',
    category: 'compras',
    top: 28,
    left: 60,
    stars: 5,
    starsMax: 12,
    locked: false,
    description: 'Distrito moderno de tiendas, cafés y karaokes.',
  },
  {
    id: 'lotte',
    name: 'Lotte World Tower',
    korean: '롯데월드타워',
    category: 'compras',
    top: 45,
    left: 83,
    stars: 3,
    starsMax: 12,
    locked: false,
    description: 'La torre más alta de Corea, con centro comercial y acuario.',
  },
  {
    id: 'palace',
    name: 'Gyeongbokgung',
    korean: '경복궁',
    category: 'cultura',
    top: 56,
    left: 31.5,
    stars: 0,
    starsMax: 12,
    locked: true,
    description: 'Palacio real de la dinastía Joseon. Cambio de guardia cada hora.',
  },
  {
    id: 'han',
    name: 'Río Han',
    korean: '한강',
    category: 'naturaleza',
    top: 60,
    left: 86.5,
    stars: 8,
    starsMax: 12,
    locked: false,
    description: 'Paseos en bici, picnic y barcos al atardecer.',
  },
  {
    id: 'hongdae',
    name: 'Hongdae',
    korean: '홍대',
    category: 'ocio',
    top: 79.5,
    left: 86,
    stars: 9,
    starsMax: 12,
    locked: false,
    description: 'Vida nocturna, música en vivo y arte callejero.',
  },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
