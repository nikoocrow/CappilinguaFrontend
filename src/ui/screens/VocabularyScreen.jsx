import { useMemo, useState } from 'react';
import { useScreenEnter } from '../anim/hooks.js';
import { useAppState } from '../state/AppState.jsx';
import { VOCAB, VOCAB_FILTERS } from '../data/vocab.js';
import { SearchIcon, SoundIcon, StarIcon } from '../components/icons/Icons.jsx';
import styles from './VocabularyScreen.module.css';

export default function VocabularyScreen() {
  const { showToast } = useAppState();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  // El filtro reescalona la grilla; el buscador no, porque se escribe letra a
  // letra y reanimar en cada tecla sería ruido.
  const scope = useScreenEnter({ replayKey: filter });
  // El toggle de "aprendida" vive acá; en producción persiste en el backend.
  const [learned, setLearned] = useState(() => new Set(VOCAB.filter((w) => w.learned).map((w) => w.id)));

  const words = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VOCAB.filter((word) => {
      const matchesFilter = filter === 'all' || word.category === filter;
      const matchesQuery =
        !q ||
        word.korean.includes(q) ||
        word.roman.toLowerCase().includes(q) ||
        word.es.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const toggleLearned = (word) => {
    setLearned((current) => {
      const next = new Set(current);
      if (next.has(word.id)) {
        next.delete(word.id);
        showToast('Marcada como pendiente');
      } else {
        next.add(word.id);
        showToast('⭐ ¡Palabra aprendida!');
      }
      return next;
    });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.backdrop} />

      <div ref={scope} className={styles.content}>
        <header className={styles.header} data-anim="head">
          <div>
            <h1 className={styles.title}>Vocabulario · Seúl 🇰🇷</h1>
            <p className={styles.subtitle}>
              {VOCAB.length} palabras descubiertas · {learned.size} aprendidas · toca 🔊 para
              escuchar la pronunciación
            </p>
          </div>

          <div className={styles.search}>
            <SearchIcon size={19} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar palabra…"
              aria-label="Buscar palabra"
            />
          </div>
        </header>

        <div className={styles.filters} data-anim="head" role="tablist" aria-label="Filtrar por categoría">
          {VOCAB_FILTERS.map((item) => (
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

        <div className={styles.grid}>
          {words.map((word) => {
            const isLearned = learned.has(word.id);
            return (
              <article key={word.id} className={styles.card} data-anim="item">
                <div className={styles.cardTop}>
                  <span className={styles.category}>{word.category}</span>
                  <button
                    type="button"
                    className={`${styles.star} ${isLearned ? styles.starOn : ''}`}
                    aria-label={isLearned ? `Marcar ${word.es} como pendiente` : `Marcar ${word.es} como aprendida`}
                    aria-pressed={isLearned}
                    onClick={() => toggleLearned(word)}
                  >
                    <StarIcon size={20} filled={isLearned} />
                  </button>
                </div>

                <div className={styles.korean} lang="ko">
                  {word.korean}
                </div>
                <div className={styles.roman}>{word.roman}</div>

                <div className={styles.divider} />

                <div className={styles.cardBottom}>
                  <span className={styles.translation}>{word.es}</span>
                  <button
                    type="button"
                    className={styles.audio}
                    aria-label={`Escuchar ${word.roman}`}
                    onClick={() => showToast(`🔊 ${word.roman}`)}
                  >
                    <SoundIcon size={20} />
                  </button>
                </div>
              </article>
            );
          })}

          {words.length === 0 && (
            <p className={styles.empty}>No hay palabras que coincidan con «{query}».</p>
          )}
        </div>
      </div>
    </div>
  );
}
