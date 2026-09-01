import { useState } from 'react';
import { useScreenEnter } from '../anim/hooks.js';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { BookIcon, GlobeIcon, TrophyIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../components/icons/Icons.jsx';
import { GoogleMark, AppleMark, DiscordMark } from '../components/icons/Brands.jsx';
import styles from './LoginScreen.module.css';

/* Login / Registro (handoff § 1). Va **fuera** del Shell: ocupa el lienzo
   completo, sin barra superior ni sidebar.

   Sin autenticación real, como el prototipo: cualquier botón de acceso entra
   al Dashboard. Cuando exista backend, este es el punto donde se cambia
   `enter()` por la llamada real y el estado de sesión pasa a AppState. */

const FEATURES = [
  {
    Icon: BookIcon,
    tint: 'rgba(124, 58, 237, 0.28)',
    title: 'Aprende vocabulario en contexto',
    text: 'Palabras útiles en situaciones reales de cada ciudad.',
  },
  {
    Icon: GlobeIcon,
    tint: 'rgba(56, 135, 255, 0.26)',
    title: 'Explora ciudades únicas',
    text: 'Viaja por Seúl, Bogotá y muchas más por descubrir.',
  },
  {
    Icon: TrophyIcon,
    tint: 'rgba(245, 196, 81, 0.22)',
    title: 'Completa misiones y gana recompensas',
    text: 'Desafíos divertidos que te motivan a seguir aprendiendo.',
  },
];

const SOCIALS = [
  { id: 'google', label: 'Continuar con Google', Mark: GoogleMark },
  { id: 'apple', label: 'Continuar con Apple', Mark: AppleMark },
  { id: 'discord', label: 'Continuar con Discord', Mark: DiscordMark },
];

export default function LoginScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  // Es la primera pantalla que ve el usuario: entra el hero y después las
  // tarjetas y el formulario, escalonados.
  const scope = useScreenEnter({ stagger: 0.07 });

  const enter = () => navigate('/inicio');

  return (
    <div ref={scope} className={styles.screen}>
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} />

        <div className={styles.heroContent}>
          <div className={styles.logo} data-anim="head">
            <img className={styles.logoAvatar} src="/ui/capy.png" alt="" />
            <div>
              <div className={styles.wordmark}>CAPPILINGUA</div>
              <div className={styles.tagline}>APRENDE · EXPLORA · CONECTA</div>
            </div>
          </div>

          <div className={styles.heroText} data-anim="head">
            <h1 className={styles.heroTitle}>
              Aprende idiomas explorando el mundo con tu <span className={styles.gold}>capibara</span>
            </h1>
            <p className={styles.heroLead}>
              Explora ciudades increíbles, descubre palabras útiles y sumérgete en nuevas culturas
              con tu mejor compañero.
            </p>

            <ul className={styles.features}>
              {FEATURES.map(({ Icon, tint, title, text }) => (
                <li key={title} className={styles.feature} data-anim="item">
                  <span className={styles.featureIcon} style={{ background: tint }}>
                    <Icon size={21} />
                  </span>
                  <div>
                    <div className={styles.featureTitle}>{title}</div>
                    <div className={styles.featureText}>{text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <form
          data-anim="item"
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            enter();
          }}
        >
          <img className={styles.formAvatar} src="/ui/capy.png" alt="" />
          <h2 className={styles.formTitle}>Bienvenido de nuevo</h2>
          <p className={styles.formSubtitle}>Inicia sesión y continúa tu aventura</p>

          <label className={styles.label} htmlFor="login-email">
            Correo electrónico
          </label>
          <div className={styles.field}>
            <MailIcon size={18} />
            <input id="login-email" type="email" placeholder="tu@email.com" autoComplete="email" />
          </div>

          <label className={styles.label} htmlFor="login-password">
            Contraseña
          </label>
          <div className={styles.field}>
            <LockIcon size={18} />
            <input
              id="login-password"
              className={styles.password}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.eye}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>

          <button type="button" className={styles.forgot} onClick={enter}>
            ¿Olvidaste tu contraseña?
          </button>

          <Button type="submit" fullWidth className={styles.submit}>
            Iniciar sesión
          </Button>

          <div className={styles.divider}>
            <span>o continúa con</span>
          </div>

          <div className={styles.socials}>
            {SOCIALS.map(({ id, label, Mark }) => (
              <button key={id} type="button" className={styles.social} aria-label={label} onClick={enter}>
                <Mark />
              </button>
            ))}
          </div>

          <p className={styles.footer}>
            ¿No tienes cuenta?{' '}
            <button type="button" className={styles.footerLink} onClick={enter}>
              Regístrate aquí
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
