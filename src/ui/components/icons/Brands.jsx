/* Marcas de los accesos sociales. Van aparte de Icons.jsx porque no son
   íconos de trazo del sistema: son logos con su color y su forma propia, y
   se dibujan a tamaño fijo. */

export function GoogleMark({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285f4" d="M23 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.17a5.28 5.28 0 0 1-2.29 3.46v2.88h3.7C21.74 18.8 23 15.8 23 12.27Z" />
      <path fill="#34a853" d="M12 23.5c3.1 0 5.7-1.03 7.58-2.8l-3.7-2.88c-1.03.69-2.35 1.1-3.88 1.1-2.98 0-5.5-2.02-6.4-4.73H1.77v2.97A11.5 11.5 0 0 0 12 23.5Z" />
      <path fill="#fbbc05" d="M5.6 14.19a6.9 6.9 0 0 1 0-4.38V6.84H1.77a11.5 11.5 0 0 0 0 10.32l3.83-2.97Z" />
      <path fill="#ea4335" d="M12 5.08c1.68 0 3.19.58 4.38 1.72l3.28-3.28C17.7 1.63 15.1.5 12 .5A11.5 11.5 0 0 0 1.77 6.84L5.6 9.81c.9-2.71 3.42-4.73 6.4-4.73Z" />
    </svg>
  );
}

export function AppleMark({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true" focusable="false">
      <path d="M16.2 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85s-1.8-.83-3-.8c-1.5.02-2.9.9-3.7 2.26-1.6 2.75-.4 6.8 1.1 9.03.75 1.1 1.6 2.3 2.8 2.26 1.1-.05 1.55-.72 2.9-.72s1.7.72 2.9.7c1.2-.02 1.95-1.1 2.7-2.2.85-1.26 1.2-2.5 1.2-2.56-.03-.02-2.3-.88-2.3-3.5ZM14 5.8c.6-.75 1-1.8.9-2.8-.9.04-2 .6-2.65 1.35-.58.65-1.1 1.72-.95 2.73 1 .08 2.03-.5 2.7-1.28Z" />
    </svg>
  );
}

export function DiscordMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#5865f2" aria-hidden="true" focusable="false">
      <path d="M19.3 5.6A16.4 16.4 0 0 0 15.2 4.3l-.2.4a15 15 0 0 1 3.6 1.5 12.8 12.8 0 0 0-11.2 0 15 15 0 0 1 3.6-1.5l-.2-.4A16.4 16.4 0 0 0 4.7 5.6C2.2 9.3 1.5 12.9 1.9 16.4a16.6 16.6 0 0 0 5 2.5l1-1.6c-.6-.2-1.2-.5-1.7-.8l.4-.3a11.9 11.9 0 0 0 10.8 0l.4.3c-.5.3-1.1.6-1.7.8l1 1.6a16.6 16.6 0 0 0 5-2.5c.5-4-.6-7.6-2.8-10.8ZM8.7 14.3c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  );
}
