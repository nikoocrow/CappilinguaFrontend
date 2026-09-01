/* Misiones por pestaña (handoff § Misiones). En producción vienen del
   backend junto con el progreso del usuario; acá son fixtures. */

export const MISSION_TABS = [
  { id: 'diarias', label: 'Diarias' },
  { id: 'historia', label: 'Historia' },
  { id: 'desafios', label: 'Desafíos' },
];

export const MISSIONS = [
  {
    id: 'coffee',
    tab: 'diarias',
    emoji: '☕',
    title: 'Pide un café en coreano',
    description: 'Aprende a ordenar en una cafetería de Myeongdong.',
    xp: 150,
    coins: 2500,
    progress: 2,
    total: 3,
  },
  {
    id: 'greet',
    tab: 'diarias',
    emoji: '💬',
    title: 'Saluda a 5 personas',
    description: 'Practica saludos formales e informales por la ciudad.',
    xp: 80,
    coins: 1200,
    progress: 5,
    total: 5,
  },
  {
    id: 'words',
    tab: 'diarias',
    emoji: '📚',
    title: 'Aprende 10 palabras nuevas',
    description: 'Amplía tu vocabulario de comida coreana.',
    xp: 100,
    coins: 1500,
    progress: 7,
    total: 10,
  },
  {
    id: 'subway',
    tab: 'historia',
    emoji: '🚇',
    title: 'Encuentra la estación de metro',
    description: 'Usa el coreano para navegar el subte de Seúl.',
    xp: 120,
    coins: 2000,
    progress: 0,
    total: 1,
  },
  {
    id: 'tower',
    tab: 'historia',
    emoji: '🗼',
    title: 'Llega a la Torre de Seúl',
    description: 'Sube por la colina de Namsan hablando coreano.',
    xp: 200,
    coins: 3000,
    progress: 1,
    total: 1,
  },
  {
    id: 'streak',
    tab: 'desafios',
    emoji: '🔥',
    title: 'Mantén una racha de 14 días',
    description: 'Practica todos los días sin fallar.',
    xp: 250,
    coins: 4000,
    progress: 12,
    total: 14,
  },
  {
    id: 'myeongdong',
    tab: 'desafios',
    emoji: '🌃',
    title: 'Visita Myeongdong de noche',
    description: 'Se desbloquea al alcanzar el nivel 16.',
    xp: 300,
    coins: 5000,
    progress: 0,
    total: 1,
    requiredLevel: 16,
  },
];

// Estado derivado: bloqueada por nivel > ya reclamada > lista para reclamar > activa.
export function missionStatus(mission, { level, claimedMissions }) {
  if (mission.requiredLevel && level < mission.requiredLevel) return 'bloqueada';
  if (claimedMissions.includes(mission.id)) return 'reclamada';
  if (mission.progress >= mission.total) return 'reclamable';
  return 'activa';
}
