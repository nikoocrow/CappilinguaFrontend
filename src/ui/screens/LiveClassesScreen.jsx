import { useState } from 'react';
import { useScreenEnter } from '../anim/hooks.js';
import { useAppState } from '../state/AppState.jsx';
import { LIVE_FILTERS, TEACHERS, classesByFilter } from '../data/classes.js';
import { VideoIcon } from '../components/icons/Icons.jsx';
import styles from './LiveClassesScreen.module.css';

/* Clases en vivo (handoff § Clases en vivo): agenda filtrable, reserva y
   entrada a la clase que está transmitiendo.

   La reserva vive en AppState (`reserved`), igual que las misiones reclamadas,
   porque el filtro "Mis clases" y el estado del botón la leen desde acá y
   desde la tarjeta de otras pantallas. */

export default function LiveClassesScreen() {
  const { reserved, reserveClass, showToast } = useAppState();
  const [filter, setFilter] = useState('hoy');
  // Cambiar de filtro reescalona la lista, que es lo único que cambia.
  const scope = useScreenEnter({ replayKey: filter });

  const classes = classesByFilter(filter, reserved);

  const handleReserve = (item) => {
    // reserveClass devuelve false si ya estaba: la reserva no se duplica
    // aunque llegue un doble click.
    if (!reserveClass(item.id)) return;
    showToast('✅ ¡Clase reservada! La verás en «Mis clases»');
  };

  return (
    <div className={styles.screen}>
      <div className={styles.backdrop} />

      <div ref={scope} className={styles.content}>
        <h1 className={styles.title} data-anim="head">Clases en vivo 🎥</h1>
        <p className={styles.subtitle} data-anim="head">
          Únete a clases con profesores nativos o reserva tu lugar en las próximas sesiones.
        </p>

        <div className={styles.filters} data-anim="head" role="tablist" aria-label="Filtro de clases">
          {LIVE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`${styles.filter} ${filter === item.id ? styles.filterActive : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {classes.length === 0 ? (
          <p className={styles.empty}>
            Todavía no reservaste ninguna clase. Explorá «Esta semana» y guardá tu lugar.
          </p>
        ) : (
          <div className={styles.list}>
            {classes.map((item) => {
              const teacher = TEACHERS[item.teacher];
              const isReserved = reserved.includes(item.id);

              return (
                <article key={item.id} className={styles.row} data-anim="item">
                  <div className={styles.when}>
                    <span className={styles.duration}>{item.duration} min</span>
                    <span className={styles.videoIcon} aria-hidden="true">
                      <VideoIcon size={26} />
                    </span>
                  </div>

                  <div className={styles.main}>
                    <div className={styles.chips}>
                      {item.state === 'live' && (
                        <span className={styles.liveBadge}>● EN VIVO</span>
                      )}
                      <span className={styles.levelChip}>{item.level}</span>
                    </div>

                    <h2 className={styles.classTitle}>{item.title}</h2>

                    <div className={styles.teacher}>
                      <span
                        className={styles.avatar}
                        style={{
                          background: `linear-gradient(135deg, ${teacher.color}, rgba(0,0,0,.25))`,
                        }}
                        aria-hidden="true"
                      >
                        {teacher.initials}
                      </span>
                      <span className={styles.teacherName}>{teacher.name}</span>
                      <span className={styles.schedule}>· {item.when} (GMT-5)</span>
                    </div>
                  </div>

                  <div className={styles.side}>
                    <span className={styles.seats}>
                      👥 {item.taken}/{item.seats} cupos
                    </span>

                    {item.state === 'live' ? (
                      <button
                        type="button"
                        className={styles.joinButton}
                        onClick={() => showToast('🎥 La sala en vivo llega en la próxima entrega')}
                      >
                        Unirse ahora
                      </button>
                    ) : isReserved ? (
                      <button type="button" className={styles.reservedButton} disabled>
                        Reservada ✓
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.reserveButton}
                        onClick={() => handleReserve(item)}
                      >
                        Reservar
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
