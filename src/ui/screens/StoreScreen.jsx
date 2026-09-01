import { useState } from 'react';
import { useScreenEnter } from '../anim/hooks.js';
import { useAppState, formatWon } from '../state/AppState.jsx';
import { STORE_TABS, FEATURED_PACK, storeItemsByTab } from '../data/store.js';
import { WonCoin, Gem } from '../components/icons/Currency.jsx';
import styles from './StoreScreen.module.css';

/* Tienda (handoff § Tienda). Comparte el registro editorial del panel de
   avatar —Cormorant, micro-etiquetas espaciadas— porque son las dos pantallas
   donde el usuario viste al personaje; el resto de la app va en Baloo.

   La compra la resuelve AppState (buyItem/buyPack): acá solo se traduce el
   resultado a un toast. Lo comprado entra a `owned`, la misma lista que ya
   usaba el avatar, así que un artículo adquirido no se puede volver a comprar. */

const CURRENCY_LABEL = {
  won: 'Wones insuficientes ₩',
  gema: 'Gemas insuficientes 💎',
};

export default function StoreScreen() {
  const { coins, gems, owned, buyItem, buyPack, showToast } = useAppState();
  const [tab, setTab] = useState('destacados');
  // La grilla se vuelve a escalonar al cambiar de categoría.
  const scope = useScreenEnter({ replayKey: tab });

  const items = storeItemsByTab(tab);
  const packOwned = FEATURED_PACK.items.every((id) => owned.includes(id));

  const handleBuy = (item) => {
    const result = buyItem(item);
    if (result === 'owned') return showToast('Ya tienes este artículo');
    if (result === 'insufficient') return showToast(CURRENCY_LABEL[item.currency]);
    showToast(`✓ ${item.name} adquirido`);
  };

  const handleBuyPack = () => {
    const result = buyPack(FEATURED_PACK);
    if (result === 'owned') return showToast('Ya tienes este artículo');
    if (result === 'insufficient') return showToast(CURRENCY_LABEL[FEATURED_PACK.currency]);
    showToast('✓ Pack Seúl adquirido');
  };

  return (
    <div className={styles.screen}>
      <div ref={scope} className={styles.content}>
        <header className={styles.header} data-anim="head">
          <div className={styles.headerBackdrop} />
          <div className={styles.headerRow}>
            <div>
              <div className={styles.microLabel}>MERCADO · 시장</div>
              <h1 className={styles.title}>Tienda</h1>
              <p className={styles.subtitle}>Gastá tus wones en piezas para tu personaje.</p>
            </div>

            <div className={styles.balances}>
              <div className={`${styles.balance} ${styles.balanceWon}`}>
                <span className={styles.balanceLabel}>TUS WONES</span>
                <span className={styles.balanceValue}>
                  <WonCoin /> ₩{formatWon(coins)}
                </span>
              </div>
              <div className={`${styles.balance} ${styles.balanceGem}`}>
                <span className={styles.balanceLabel}>GEMAS</span>
                <span className={styles.balanceValue}>
                  <Gem /> {formatWon(gems)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.body}>
          <section className={styles.pack} data-anim="head">
            <span className={styles.packGlyph} aria-hidden="true">✦</span>
            <div className={styles.packBody}>
              <div className={styles.microLabel}>PACK DESTACADO</div>
              <h2 className={styles.packTitle}>{FEATURED_PACK.title}</h2>
              <p className={styles.packText}>{FEATURED_PACK.description}</p>
            </div>
            <div className={styles.packSide}>
              <span className={styles.packListPrice}>₩{formatWon(FEATURED_PACK.listPrice)}</span>
              <span className={styles.packPrice}>
                <WonCoin size={22} /> ₩{formatWon(FEATURED_PACK.price)}
              </span>
              <button
                type="button"
                className={packOwned ? styles.buyOwned : styles.buyLight}
                onClick={handleBuyPack}
                disabled={packOwned}
              >
                {packOwned ? 'Adquirido' : 'Comprar pack'}
              </button>
            </div>
          </section>

          <div className={styles.tabs} data-anim="head" role="tablist" aria-label="Categoría de la tienda">
            {STORE_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.grid}>
            {items.map((item) => {
              const isOwned = owned.includes(item.id);

              return (
                <article key={item.id} className={styles.card} data-anim="item">
                  {item.badge && <span className={styles.badge}>{item.badge}</span>}

                  <div className={styles.art}>
                    {item.image ? (
                      <img src={item.image} alt="" className={styles.artImage} />
                    ) : (
                      <span className={styles.artEmoji} aria-hidden="true">{item.emoji}</span>
                    )}
                  </div>

                  <h3 className={styles.itemName}>{item.name}</h3>
                  {item.description && <p className={styles.itemText}>{item.description}</p>}

                  <span className={styles.price}>
                    {item.currency === 'gema' ? <Gem size={18} /> : <WonCoin size={18} />}
                    {item.currency === 'gema' ? formatWon(item.price) : `₩${formatWon(item.price)}`}
                  </span>

                  <button
                    type="button"
                    className={isOwned ? styles.buyOwned : styles.buyLight}
                    onClick={() => handleBuy(item)}
                    disabled={isOwned}
                  >
                    {isOwned ? 'Adquirido' : 'Comprar'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
