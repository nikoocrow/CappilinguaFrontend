/* Tanda de preguntas de la lección (handoff § Lección). `correct` es el
   índice de la opción correcta. La recompensa es la de la misión que abrió
   la lección; este set es el de "Pide un café en coreano". */

export const LESSON = {
  missionId: 'coffee',
  title: 'Pediste tu café en coreano',
  reward: { xp: 150, coins: 2500 },
  questions: [
    {
      bubble: '안녕하세요?',
      prompt: '¿Cómo se dice «Hola» de forma formal?',
      correct: 0,
      options: [
        { main: '안녕하세요', sub: 'Hola (formal)' },
        { main: '감사합니다', sub: 'Gracias' },
        { main: '사랑해요', sub: 'Te quiero' },
        { main: '잘 가요', sub: 'Adiós' },
      ],
    },
    {
      bubble: '커피 한 잔이요!',
      prompt: 'Estás en una cafetería. ¿Cómo pides un café?',
      correct: 0,
      options: [
        { main: '커피 주세요', sub: 'Un café, por favor' },
        { main: '물 주세요', sub: 'Agua, por favor' },
        { main: '얼마예요?', sub: '¿Cuánto cuesta?' },
        { main: '화장실 어디예요?', sub: '¿Dónde está el baño?' },
      ],
    },
    {
      bubble: '맛있어요!',
      prompt: '¿Qué significa «맛있어요»?',
      correct: 0,
      options: [
        { main: 'Está delicioso', sub: '맛있어요' },
        { main: 'Estoy lleno', sub: '배불러요' },
        { main: 'Qué caro', sub: '비싸요' },
        { main: 'Buenos días', sub: '좋은 아침' },
      ],
    },
  ],
};
