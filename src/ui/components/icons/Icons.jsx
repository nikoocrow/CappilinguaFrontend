/* Íconos de UI: SVG inline de trazo (estilo Lucide/Feather), como en el
   handoff — stroke-width 2, extremos y uniones redondeados. Si más adelante
   el proyecto adopta una librería de íconos, se reemplaza este archivo y
   nada más cambia. */

function Svg({ size = 22, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </Svg>
);

export const VideoIcon = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="13" height="12" rx="3" />
    <path d="m15.5 11 6-3.5v9l-6-3.5z" />
  </Svg>
);

export const TargetIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" />
  </Svg>
);

export const BookIcon = (p) => (
  <Svg {...p}>
    <path d="M4 4.5h5.5A2.5 2.5 0 0 1 12 7v13a2 2 0 0 0-2-2H4z" />
    <path d="M20 4.5h-5.5A2.5 2.5 0 0 0 12 7v13a2 2 0 0 1 2-2h6z" />
  </Svg>
);

export const UserIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Svg>
);

export const MapIcon = (p) => (
  <Svg {...p}>
    <path d="m3 6.5 6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" />
    <path d="M9 4v14M15 6.5v14" />
  </Svg>
);

export const StoreIcon = (p) => (
  <Svg {...p}>
    <path d="M4 8.5h16l-1 11.5H5z" />
    <path d="M8.5 8.5v-2a3.5 3.5 0 0 1 7 0v2" />
  </Svg>
);

export const SettingsIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.1 14.9a1.7 1.7 0 0 0 .35 1.87l.06.07a2 2 0 1 1-2.83 2.83l-.06-.07a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.55V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.56 1.7 1.7 0 0 0-1.87.35l-.07.06a2 2 0 1 1-2.83-2.83l.07-.07a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1.03H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.56-1.1 1.7 1.7 0 0 0-.35-1.87l-.06-.07a2 2 0 1 1 2.83-2.83l.07.06a1.7 1.7 0 0 0 1.87.35H9a1.7 1.7 0 0 0 1.03-1.55V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.35l.07-.06a2 2 0 1 1 2.83 2.83l-.06.07a1.7 1.7 0 0 0-.35 1.87V9a1.7 1.7 0 0 0 1.55 1.03H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.55 1.03z" />
  </Svg>
);

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);

export const PlusIcon = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const MinusIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);

export const CrosshairIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v3M12 19v3M22 12h-3M5 12H2" />
  </Svg>
);

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const ChevronLeftIcon = (p) => (
  <Svg {...p}>
    <path d="m14.5 5-7 7 7 7" />
  </Svg>
);

export const ChevronRightIcon = (p) => (
  <Svg {...p}>
    <path d="m9.5 5 7 7-7 7" />
  </Svg>
);

export const ChevronDownIcon = (p) => (
  <Svg {...p}>
    <path d="m5 9.5 7 7 7-7" />
  </Svg>
);

export const SoundIcon = (p) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
    <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
);

export const SendIcon = (p) => (
  <Svg {...p}>
    <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-8-8-4z" />
  </Svg>
);

// Estrella: `filled` la rellena en dorado (palabra aprendida), si no queda
// solo contorneada.
export function StarIcon({ size = 20, filled = false, ...props }) {
  return (
    <Svg size={size} fill={filled ? 'currentColor' : 'none'} {...props}>
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.05 5.9L12 16.9 6.75 19.7l1.05-5.9L3.5 9.7l5.9-.8z" />
    </Svg>
  );
}

/* Mostrar/ocultar el chrome de la app en el modo inmersivo: el panel con
   sidebar marcado, y las flechas de "expandir a pantalla completa". */
export const PanelIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M9.5 4v16" />
  </Svg>
);

export const ExpandIcon = (p) => (
  <Svg {...p}>
    <path d="M8.5 3.5H3.5v5" />
    <path d="M15.5 3.5h5v5" />
    <path d="M15.5 20.5h5v-5" />
    <path d="M8.5 20.5H3.5v-5" />
  </Svg>
);

/* Campos y tarjetas del login. */
export const MailIcon = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </Svg>
);

export const LockIcon = (p) => (
  <Svg {...p}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const EyeIcon = (p) => (
  <Svg {...p}>
    <path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const EyeOffIcon = (p) => (
  <Svg {...p}>
    <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c5.9 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.4 7.9A17 17 0 0 0 2.5 12s3.6 6 9.5 6c1.6 0 3-.4 4.3-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m3.5 3.5 17 17" />
  </Svg>
);

export const GlobeIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.2 9.5h17.6M3.2 14.5h17.6" />
    <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
  </Svg>
);

export const TrophyIcon = (p) => (
  <Svg {...p}>
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" />
    <path d="M12 15v3M8.5 20.5h7" />
  </Svg>
);
