/* Clases en vivo y profesores (handoff § Clases en vivo). Fixtures: en
   producción la agenda, los cupos y el estado EN VIVO llegan del backend —
   `state: 'live'` acá es un dato fijo, no una hora real. */

export const LIVE_FILTERS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'todas', label: 'Todas' },
  { id: 'mias', label: 'Mis clases' },
];

export const TEACHERS = {
  jihoon: { id: 'jihoon', name: 'Profe Jihoon', initials: 'JH', color: '#3b82f6', chip: 'Embajador', specialty: 'Conversación y cultura coreana' },
  minji: { id: 'minji', name: 'Profe Minji', initials: 'MJ', color: '#ec4899', chip: 'TOPIK', specialty: 'TOPIK I & II · Clases dinámicas' },
  alex: { id: 'alex', name: 'Profe Alex', initials: 'AX', color: '#22c55e', chip: 'Gramática', specialty: 'Gramática coreana con ejemplos prácticos' },
  david: { id: 'david', name: 'Profe David', initials: 'DV', color: '#f59e0b', chip: 'Pronunciación', specialty: 'Pronunciación y fluidez' },
};

export const CLASSES = [
  {
    id: 'food',
    title: 'Cómo pedir comida en coreano',
    teacher: 'minji',
    when: 'Hoy · 7:00 PM',
    day: 'hoy',
    level: 'Principiante',
    duration: 45,
    taken: 12,
    seats: 20,
    state: 'live',
  },
  {
    id: 'group',
    title: 'Conversación grupal para principiantes',
    teacher: 'david',
    when: 'Mañana · 6:00 PM',
    day: 'semana',
    level: 'A1–A2',
    duration: 60,
    taken: 8,
    seats: 15,
    state: 'next',
  },
  {
    id: 'particles',
    title: 'Partículas 은/는 vs 이/가',
    teacher: 'alex',
    when: 'Jue · 5:00 PM',
    day: 'semana',
    level: 'Intermedio',
    duration: 50,
    taken: 5,
    seats: 12,
    state: 'next',
  },
  {
    id: 'pronunciation',
    title: 'Pronunciación: sonidos difíciles',
    teacher: 'jihoon',
    when: 'Vie · 8:00 PM',
    day: 'semana',
    level: 'Todos',
    duration: 40,
    taken: 18,
    seats: 25,
    state: 'next',
  },
  {
    id: 'kdrama',
    title: 'K-Drama club: aprende con escenas',
    teacher: 'minji',
    when: 'Sáb · 4:00 PM',
    day: 'semana',
    level: 'Intermedio',
    duration: 60,
    taken: 9,
    seats: 20,
    state: 'next',
  },
];

// `mias` no filtra por día sino por lo reservado, por eso necesita el estado.
export function classesByFilter(filter, reserved) {
  if (filter === 'todas') return CLASSES;
  if (filter === 'mias') return CLASSES.filter((item) => reserved.includes(item.id));
  if (filter === 'semana') return CLASSES.filter((item) => item.day === 'hoy' || item.day === 'semana');
  return CLASSES.filter((item) => item.day === filter);
}
