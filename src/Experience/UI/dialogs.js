// Datos de ejercicios para Capilingua.
// Cada opción marca si es la respuesta correcta y trae su feedback:
// si el usuario se equivoca, el feedback explica qué significa lo que eligió.

export const KOREAN_GREETING_DIALOG = {
  npcLine: '안녕하세요! (annyeong-haseyo)',
  prompt: '¿Cómo respondes al saludo de Capi?',
  options: [
    {
      text: '안녕하세요 (annyeong-haseyo)',
      correct: true,
      feedback: '¡Correcto! 안녕하세요 es el saludo estándar en coreano y también se usa para responder al saludo. 잘 했어요 (¡bien hecho!)',
    },
    {
      text: '감사합니다 (gamsahamnida)',
      correct: false,
      feedback: 'Casi… 감사합니다 significa «gracias». Se usa cuando alguien te ayuda o te da algo, no para saludar.',
    },
    {
      text: '안녕히 가세요 (annyeonghi gaseyo)',
      correct: false,
      feedback: 'No exactamente: 안녕히 가세요 es una despedida — se le dice a la persona que se va. Capi acaba de llegar.',
    },
    {
      text: '잘 자요 (jal jayo)',
      correct: false,
      feedback: 'Ups, 잘 자요 significa «que duermas bien». Guárdalo para la noche.',
    },
  ],
};
