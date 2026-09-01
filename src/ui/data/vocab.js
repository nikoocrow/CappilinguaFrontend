/* Vocabulario descubierto (handoff § Vocabulario). `learned` es el estado
   inicial; el toggle de la estrella vive en el estado de la pantalla y en
   producción debe persistir contra el backend. */

export const VOCAB_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'Saludos', label: 'Saludos' },
  { id: 'Comida', label: 'Comida' },
  { id: 'Transporte', label: 'Transporte' },
  { id: 'Compras', label: 'Compras' },
];

export const VOCAB = [
  { id: 'hola', korean: '안녕하세요', roman: 'annyeonghaseyo', es: 'Hola (formal)', category: 'Saludos', learned: true },
  { id: 'gracias', korean: '감사합니다', roman: 'gamsahamnida', es: 'Gracias', category: 'Saludos', learned: true },
  { id: 'amor', korean: '사랑해요', roman: 'saranghaeyo', es: 'Te quiero', category: 'Saludos', learned: false },
  { id: 'cafe', korean: '커피', roman: 'keopi', es: 'Café', category: 'Comida', learned: true },
  { id: 'agua', korean: '물', roman: 'mul', es: 'Agua', category: 'Comida', learned: true },
  { id: 'rico', korean: '맛있어요', roman: 'masisseoyo', es: 'Está delicioso', category: 'Comida', learned: false },
  { id: 'metro', korean: '지하철', roman: 'jihacheol', es: 'Metro', category: 'Transporte', learned: true },
  { id: 'precio', korean: '얼마예요?', roman: 'eolmayeyo', es: '¿Cuánto cuesta?', category: 'Compras', learned: false },
  { id: 'bano', korean: '화장실', roman: 'hwajangsil', es: 'Baño', category: 'Lugares', learned: true },
];
