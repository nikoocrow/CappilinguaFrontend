import { useState } from 'react';
import { useScreenEnter, usePopIn } from '../anim/hooks.js';
import { useNavigate } from 'react-router-dom';
import { useAppState, formatWon } from '../state/AppState.jsx';
import { PLACES, CATEGORIES, categoryById } from '../data/places.js';
import ProgressBar from '../components/ProgressBar.jsx';
import Button from '../components/Button.jsx';
import MissionCard from '../components/MissionCard.jsx';
import {
  SearchIcon,
  PlusIcon,
  MinusIcon,
  CrosshairIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '../components/icons/Icons.jsx';
import styles from './MapScreen.module.css';

/* Mapa de la ciudad al estilo Kakao Maps: imagen del mapa con el chrome
   flotando encima. La escena 3D vive en Inicio; acá el mapa es la vista
   general de Seúl para elegir a dónde ir.

   Clave del zoom: la imagen y los pines viven en el **mismo contenedor
   escalado**. Escalar solo la imagen desincronizaría los pines. Cada pin se
   contra-escala con scale(1/z) y `transform-origin: bottom center` para
   conservar su tamaño en pantalla con la punta anclada al mismo punto. */

const ZOOM_MIN = 1;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.15;

export default function MapScreen() {
  const navigate = useNavigate();
  const { level, xp, showToast } = useAppState();

  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [selectedId, setSelectedId] = useState('hongdae');
  const [category, setCategory] = useState('todos');

  const selected = PLACES.find((place) => place.id === selectedId);
  const visiblePlaces =
    category === 'todos' ? PLACES : PLACES.filter((place) => place.category === category);

  // Redondeado a 2 decimales: sumar 0.15 cuatro veces da 1.5999999999999996,
  // que se muestra como 160% pero nunca llega a ZOOM_MAX y dejaba el botón
  // "+" habilitado en el tope.
  const applyZoom = (next) =>
    setZoom(Math.round(Math.min(Math.max(next, ZOOM_MIN), ZOOM_MAX) * 100) / 100);

  const recenter = () => {
    applyZoom(ZOOM_MIN);
    showToast('📍 Vista centrada en Seúl');
  };

  const openLesson = () => navigate('/leccion', { state: { missionId: 'coffee' } });

  // Los overlays del mapa (buscador, insignia, misión, dock) entran juntos;
  // los pines no se animan: su transform es la contra-escala del zoom y GSAP
  // lo pisaría.
  const scope = useScreenEnter();

  return (
    <div ref={scope} className={styles.screen}>
      <div
        className={styles.viewport}
        onWheel={(event) => applyZoom(zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))}
      >
        <div className={styles.scaled} style={{ transform: `scale(${zoom})` }}>
          <img className={styles.mapImage} src="/ui/seoul-map-v3.png" alt="Mapa de Seúl" />

          {/* Los pines no llevan etiqueta: el mapa ya trae los nombres
              pintados. Si se cambia por un mapa sin rótulos, mostrar `name`. */}
          {visiblePlaces.map((place) => {
            const cat = categoryById(place.category);
            const isSelected = place.id === selectedId;
            return (
              <button
                key={place.id}
                type="button"
                className={`${styles.pin} ${isSelected ? styles.pinSelected : ''}`}
                style={{
                  top: `${place.top}%`,
                  left: `${place.left}%`,
                  transform: `translate(-50%, -100%) scale(${1 / zoom})`,
                  '--pin-color': place.locked ? '#8b95a1' : cat.color,
                  '--pin-halo': `${place.locked ? '#8b95a1' : cat.color}44`,
                }}
                aria-label={`${place.name}${place.locked ? ' (bloqueado)' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedId(place.id)}
              >
                <span className={styles.pinShape}>
                  <span className={styles.pinGlyph}>{place.locked ? '🔒' : cat.glyph}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Velos que funden el mapa con el chrome de la app */}
      <div className={styles.veilTop} />
      <div className={styles.veilBottom} />

      {/* Buscador + chips de categoría */}
      <div className={styles.topLeft} data-anim="head">
        <div className={styles.search}>
          <SearchIcon size={19} />
          <input placeholder="Buscar lugar en Seúl" aria-label="Buscar lugar en Seúl" />
          <span className={styles.searchDivider} />
          <button
            type="button"
            className={styles.searchAction}
            aria-label="Ir a vocabulario"
            onClick={() => navigate('/vocabulario')}
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>

        <div className={styles.chips}>
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              className={`${styles.chip} ${category === item.id ? styles.chipActive : ''}`}
              onClick={() => setCategory(item.id)}
            >
              <span className={styles.chipDot} style={{ background: item.color }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insignia de ciudad */}
      <div className={styles.cityBadge} data-anim="head">
        <span className={styles.flag}>🇰🇷</span>
        <div>
          <div className={styles.cityName}>SEÚL</div>
          <div className={styles.cityMeta}>
            Nivel {level} · {formatWon(xp)} XP
          </div>
        </div>
        <ChevronDownIcon size={18} />
      </div>

      <div className={styles.missionSlot} data-anim="head">
        <MissionCard onClick={openLesson} />
      </div>

      {/* Barra de controles */}
      <div className={styles.dock} data-anim="head">
        <div className={styles.compass} aria-hidden="true">
          <span className={styles.compassNeedle} />
          <span className={styles.compassN}>N</span>
        </div>
        <span className={styles.dockDivider} />
        <button
          type="button"
          className={styles.dockButton}
          aria-label="Alejar"
          onClick={() => applyZoom(zoom - ZOOM_STEP)}
          disabled={zoom <= ZOOM_MIN}
        >
          <MinusIcon size={18} />
        </button>
        <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className={styles.dockButton}
          aria-label="Acercar"
          onClick={() => applyZoom(zoom + ZOOM_STEP)}
          disabled={zoom >= ZOOM_MAX}
        >
          <PlusIcon size={18} />
        </button>
        <span className={styles.dockDivider} />
        <button
          type="button"
          className={styles.dockButton}
          aria-label="Recentrar la vista"
          onClick={recenter}
        >
          <CrosshairIcon size={18} />
        </button>
      </div>

      {/* Ficha del lugar */}
      {selected && (
        <PlaceSheet
          key={selected.id}
          place={selected}
          onPractice={openLesson}
          onVocab={() => navigate('/vocabulario')}
          onLocked={() => showToast('🔒 Sigue jugando para desbloquear este lugar')}
        />
      )}
    </div>
  );
}

function PlaceSheet({ place, onPractice, onVocab, onLocked }) {
  const cat = categoryById(place.category);
  // `key` en el padre: la ficha vuelve a entrar al elegir otro lugar, no solo
  // la primera vez que aparece.
  const ref = usePopIn({ y: 18, scale: 0.98 });

  return (
    <aside ref={ref} className={styles.sheet}>
      <div className={styles.sheetHeader}>
        <div>
          <h2 className={styles.sheetName}>{place.name}</h2>
          <div className={styles.sheetKorean} lang="ko">
            {place.korean}
          </div>
        </div>
        <span className={styles.sheetStars}>
          ⭐ {place.stars}/{place.starsMax}
        </span>
      </div>

      <span className={styles.sheetCategory} style={{ background: `${cat.color}26`, color: cat.color }}>
        {cat.glyph} {cat.label}
      </span>

      <p className={styles.sheetDescription}>{place.description}</p>

      <div className={styles.sheetProgress}>
        <ProgressBar
          value={place.stars}
          max={place.starsMax}
          height={8}
          fill={`linear-gradient(90deg, ${cat.color}aa, ${cat.color})`}
          label={`Progreso en ${place.name}`}
        />
        <span className={styles.sheetPercent}>
          {Math.round((place.stars / place.starsMax) * 100)}%
        </span>
      </div>

      <div className={styles.sheetActions}>
        {place.locked ? (
          <Button
            variant="done"
            className={styles.lockedButton}
            aria-disabled="true"
            onClick={onLocked}
            fullWidth
          >
            Bloqueado
          </Button>
        ) : (
          <>
            <Button onClick={onPractice} style={{ flex: 1 }}>
              Practicar aquí
            </Button>
            <Button variant="ghost" onClick={onVocab}>
              Vocabulario
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
