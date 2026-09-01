import styles from './Button.module.css';

/* Botón único de la app. La variante primaria está fijada al **estilo B**
   del handoff (plano: #7c3aed, borde 2px lavanda, radio 9px, sombra sólida
   y etiqueta en versalitas). El toggle A/B del prototipo no se porta: era
   una herramienta para elegir dirección visual, ya elegida. */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon = null,
  className = '',
  children,
  ...props
}) {
  const classes = [styles.btn, styles[variant], styles[size], fullWidth ? styles.full : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}
