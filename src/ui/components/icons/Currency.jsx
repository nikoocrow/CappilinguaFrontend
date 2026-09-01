/* Fichas de moneda del handoff: el won es un círculo celadón con el glifo ₩,
   la gema un rombo morado con faceta clara. Van como componentes porque
   aparecen en la barra superior, misiones, tienda y lecciones. */

export function WonCoin({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10.5" fill="#4fb3a8" stroke="#2f8378" strokeWidth="1.6" />
      <text
        x="12"
        y="16.4"
        textAnchor="middle"
        fill="#06231f"
        fontFamily="'Baloo 2', sans-serif"
        fontWeight="800"
        fontSize="13"
      >
        ₩
      </text>
    </svg>
  );
}

export function Gem({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2 22 12 12 22 2 12z" fill="#a87bff" />
      <path d="M12 2 22 12h-10z" fill="#d3bcff" />
    </svg>
  );
}

// Ficha de nivel de la barra superior: estrella dorada con el número encima.
export function LevelToken({ size = 44, level }) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="m12 2.6 2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5 6.2 20.55l1.1-6.5-4.7-4.6 6.5-.95z"
          fill="#f5c451"
          stroke="#f2a93a"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: size * 0.36,
          color: '#5b3d05',
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        {level}
      </span>
    </div>
  );
}
