import { useRef, useState } from 'react';
import { useScreenEnter } from '../anim/hooks.js';
import { useNavigate } from 'react-router-dom';
import {
  OUTFIT_SLOTS,
  SKIN_TONES,
  loadCharacterConfig,
  defaultCharacterConfig,
  randomCharacterConfig,
} from '../../Experience/World/characterConfig.js';
import { useAppState } from '../state/AppState.jsx';
import AvatarCanvas from '../components/AvatarCanvas.jsx';
import Button from '../components/Button.jsx';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons/Icons.jsx';
import styles from './AvatarScreen.module.css';

/* Panel de personalización en registro editorial (referencia Anatomy Atelier
   del handoff), pero conectado al personaje 3D real: las filas salen de
   OUTFIT_SLOTS (characterConfig.js), que es la convención de nombres de malla
   del GLB, no de una lista de diseño. Por eso los nombres de las opciones son
   los del modelo; cuando existan las piezas de la colección Seúl (bucket,
   gorro rana, hanbok…) se agregan como opciones de su slot y esta pantalla
   las muestra sin cambios. */

// Glifo fino por slot, en vez de emoji, como pide el registro editorial.
const SLOT_GLYPHS = {
  hair: '❋',
  face: '◈',
  top: '◇',
  bottom: '⌁',
  socks: '✧',
  shoes: '⌖',
  gloves: '✿',
  hat: '✦',
  glasses: '◉',
  extra: '♙',
};

const STATS = [
  { label: 'RACHA', value: '12', unit: 'días' },
  { label: 'VOCABULARIO', value: '532', unit: 'palabras' },
  { label: 'MISIONES', value: '45', unit: 'completadas' },
  { label: 'CIUDADES', value: '2/10', unit: 'visitadas' },
];

export default function AvatarScreen() {
  const navigate = useNavigate();
  const { showToast } = useAppState();

  const stageRef = useRef(null);
  const [config, setConfig] = useState(() => loadCharacterConfig());
  // El canvas del personaje no entra en la animación: solo el panel editorial.
  const scope = useScreenEnter({ stagger: 0.04 });

  // Aplica una configuración completa (aleatorio / restablecer) al personaje.
  const applyConfig = (next) => {
    setConfig(next);
    const stage = stageRef.current;
    if (!stage) return;
    for (const slot of OUTFIT_SLOTS) stage.setSlotOption(slot.key, next.selection[slot.key]);
    stage.setSkinColor(next.skinColor);
  };

  const cycleSlot = (slot, direction) => {
    const options = slot.options;
    const current = options.findIndex((option) => option.mesh === config.selection[slot.key]);
    // Ciclado sin topes: (i ± 1 + n) % n
    const nextIndex = ((current === -1 ? 0 : current) + direction + options.length) % options.length;
    const mesh = options[nextIndex].mesh;

    setConfig((c) => ({ ...c, selection: { ...c.selection, [slot.key]: mesh } }));
    stageRef.current?.setSlotOption(slot.key, mesh);
  };

  const setSkin = (hex) => {
    setConfig((c) => ({ ...c, skinColor: hex }));
    stageRef.current?.setSkinColor(hex);
  };

  return (
    <div ref={scope} className={styles.screen}>
      <section className={styles.preview}>
        <AvatarCanvas onStage={(stage) => (stageRef.current = stage)} />

        <div className={styles.previewOverlay} data-anim="head">
          <div className={styles.location}>
            <span className={styles.pin} aria-hidden="true" />
            <div>
              <div className={styles.city}>SEÚL</div>
              <div className={styles.country}>COREA DEL SUR 🇰🇷</div>
            </div>
          </div>

          <div className={styles.rank}>
            <span aria-hidden="true">✎</span> EXPLORADOR NOVATO
          </div>

          <div className={styles.stats}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <div className={styles.statLabel}>{stat.label}</div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statUnit}>{stat.unit}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className={styles.panel}>
        <header className={styles.panelHeader} data-anim="head">
          <div className={styles.microLabel}>ATELIER · SEÚL</div>
          <h1 className={styles.panelTitle}>Personalizá tu personaje</h1>
          <p className={styles.panelSubtitle}>Ajustá cada detalle de tu viajero.</p>

          <div className={styles.panelActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                applyConfig(randomCharacterConfig());
                showToast('🎲 ¡Look aleatorio generado!');
              }}
            >
              <span className={styles.glyphAccent}>✦</span> Aleatorio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                applyConfig(defaultCharacterConfig());
                showToast('↺ Look restablecido');
              }}
            >
              <span className={styles.glyphAccent}>↺</span> Restablecer
            </Button>
          </div>
        </header>

        <div className={styles.rows}>
          {OUTFIT_SLOTS.map((slot, index) => {
            const options = slot.options;
            const activeIndex = Math.max(
              0,
              options.findIndex((option) => option.mesh === config.selection[slot.key])
            );

            return (
              <div key={slot.key} className={styles.row} data-anim="item">
                <div className={styles.rowHead}>
                  <span className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.rowLabel}>{slot.label}</span>
                  <span className={styles.rowGlyph} aria-hidden="true">
                    {SLOT_GLYPHS[slot.key] ?? '◇'}
                  </span>
                </div>

                <div className={styles.rowControl}>
                  <button
                    type="button"
                    className={styles.arrow}
                    aria-label={`${slot.label}: opción anterior`}
                    onClick={() => cycleSlot(slot, -1)}
                  >
                    <ChevronLeftIcon size={16} />
                  </button>

                  <div className={styles.rowValue}>
                    <div className={styles.optionName}>{options[activeIndex].label}</div>
                    <div className={styles.dots}>
                      {options.map((option, i) => (
                        <span
                          key={option.label}
                          className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.arrow}
                    aria-label={`${slot.label}: opción siguiente`}
                    onClick={() => cycleSlot(slot, 1)}
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Tono de piel: no es un slot de malla sino un tinte sobre el
              material del cuerpo, por eso va como fila de muestras. */}
          <div className={styles.row} data-anim="item">
            <div className={styles.rowHead}>
              <span className={styles.rowNumber}>{String(OUTFIT_SLOTS.length + 1).padStart(2, '0')}</span>
              <span className={styles.rowLabel}>Tono de piel</span>
              <span className={styles.rowGlyph} aria-hidden="true">
                ✧
              </span>
            </div>

            <div className={styles.swatches}>
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone.label}
                  type="button"
                  className={`${styles.swatch} ${
                    config.skinColor === tone.color ? styles.swatchActive : ''
                  }`}
                  style={{ background: tone.color }}
                  aria-label={`Tono ${tone.label}`}
                  aria-pressed={config.skinColor === tone.color}
                  onClick={() => setSkin(tone.color)}
                />
              ))}
            </div>
          </div>
        </div>

        <footer className={styles.panelFooter} data-anim="head">
          <Button variant="ghost" onClick={() => navigate('/tienda')}>
            Tienda
          </Button>
          <Button
            fullWidth
            onClick={() => {
              stageRef.current?.save();
              showToast('✅ ¡Cambios guardados!');
            }}
          >
            Guardar cambios
          </Button>
        </footer>
      </aside>
    </div>
  );
}
