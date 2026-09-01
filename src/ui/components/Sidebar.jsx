import { NavLink, useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppState.jsx';
import {
  HomeIcon,
  VideoIcon,
  TargetIcon,
  BookIcon,
  UserIcon,
  MapIcon,
  StoreIcon,
  SettingsIcon,
} from './icons/Icons.jsx';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/inicio', label: 'Simulación', Icon: HomeIcon },
  { to: '/clases', label: 'Clases en vivo', Icon: VideoIcon },
  { to: '/misiones', label: 'Misiones', Icon: TargetIcon },
  { to: '/vocabulario', label: 'Vocabulario', Icon: BookIcon },
  { to: '/avatar', label: 'Avatar', Icon: UserIcon },
  { to: '/mapa', label: 'Mapa Ciudad', Icon: MapIcon },
  { to: '/tienda', label: 'Tienda', Icon: StoreIcon },
];

const SOCIALS = [
  {
    label: 'Discord',
    path: 'M8.5 15.5c2.3 1.2 4.7 1.2 7 0M9.2 12.2h.01M14.8 12.2h.01M15.5 6l1 1.7c1.6.5 3 1.4 3.7 2.6.9 2.3 1.2 4.7.8 7-.1.6-1.9 1.9-4 2.4l-1-1.6M8.5 6l-1 1.7c-1.6.5-3 1.4-3.7 2.6-.9 2.3-1.2 4.7-.8 7 .1.6 1.9 1.9 4 2.4l1-1.6',
  },
  {
    label: 'Instagram',
    path: 'M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5ZM12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM17 7h.01',
  },
  {
    label: 'Twitter',
    path: 'M20.5 5.5c-.7.5-1.5.8-2.3 1a3.6 3.6 0 0 0-6.2 3.3C8.5 9.6 5.6 8 3.7 5.5c-1 1.7-.5 3.9 1.1 5-.6 0-1.2-.2-1.7-.5 0 1.8 1.2 3.3 2.9 3.6-.5.2-1.1.2-1.6.1.5 1.5 1.8 2.5 3.4 2.6A7.2 7.2 0 0 1 3 17.9a10.2 10.2 0 0 0 15.7-9.1c.7-.5 1.3-1.2 1.8-2Z',
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { showToast } = useAppState();

  return (
    <nav className={styles.sidebar} aria-label="Navegación principal">
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          <Icon size={22} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}

      <div className={styles.spacer} />

      {/* TEMPORAL: atajo para mostrar el login mientras Ajustes sigue siendo
          fase 2. Se saca junto con el de TopBar.jsx. */}
      <button
        type="button"
        className={styles.item}
        title="Temporal: ver la interfaz de login"
        onClick={() => navigate('/login')}
      >
        <SettingsIcon size={22} />
        <span className={styles.label}>Ajustes · Login</span>
      </button>

      <div className={styles.socials}>
        {SOCIALS.map(({ label, path }) => (
          <a
            key={label}
            className={styles.social}
            href="#"
            aria-label={label}
            onClick={(event) => {
              event.preventDefault();
              showToast(`${label} — próximamente`);
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={path} />
            </svg>
          </a>
        ))}
      </div>
    </nav>
  );
}
