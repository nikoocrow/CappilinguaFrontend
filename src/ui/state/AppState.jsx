import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* Estado global de sesión y economía (handoff § State Management).
   Lo que es UI de una sola pantalla (filtros, pestañas, paso de la lección)
   vive en la pantalla, no acá. En producción estos valores vienen del backend
   y las mutaciones (comprar, reclamar, recompensa) se validan en el servidor;
   el cliente solo refleja el resultado. */

const INITIAL = {
  coins: 48500, // wones ₩
  gems: 320,
  xp: 2780,
  xpMax: 4200,
  level: 14,
  owned: ['beanie', 'glasses', 'korea', 'hoodie', 'hello', 'cat'],
  following: ['jihoon'],
  reserved: [],
  claimedMissions: [],
};

const TOAST_MS = 2200;

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, setState] = useState(INITIAL);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Un solo toast a la vez: cada uno cancela el temporizador del anterior,
  // y el timer se limpia al desmontar.
  const showToast = useCallback((message) => {
    setToast({ message, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const addReward = useCallback(({ xp = 0, coins = 0, gems = 0 }) => {
    setState((s) => ({
      ...s,
      coins: s.coins + coins,
      gems: s.gems + gems,
      xp: s.xp + xp,
    }));
  }, []);

  const claimMission = useCallback((missionId) => {
    let claimed = false;
    setState((s) => {
      if (s.claimedMissions.includes(missionId)) return s;
      claimed = true;
      return { ...s, claimedMissions: [...s.claimedMissions, missionId] };
    });
    return claimed;
  }, []);

  /* Compra de un artículo de la tienda. Devuelve el resultado en vez de
     lanzar el toast: la pantalla decide el texto. El saldo se lee dentro del
     updater (no de la clausura) para que dos clicks seguidos no gasten dos
     veces sobre el mismo saldo viejo. */
  const buyItem = useCallback(({ id, price, currency }) => {
    let result = 'ok';
    setState((s) => {
      if (s.owned.includes(id)) {
        result = 'owned';
        return s;
      }
      const wallet = currency === 'gema' ? 'gems' : 'coins';
      if (s[wallet] < price) {
        result = 'insufficient';
        return s;
      }
      return { ...s, [wallet]: s[wallet] - price, owned: [...s.owned, id] };
    });
    return result;
  }, []);

  // El pack usa Set para no duplicar lo que el usuario ya tenía suelto.
  const buyPack = useCallback(({ items, price, currency = 'won' }) => {
    let result = 'ok';
    setState((s) => {
      if (items.every((id) => s.owned.includes(id))) {
        result = 'owned';
        return s;
      }
      const wallet = currency === 'gema' ? 'gems' : 'coins';
      if (s[wallet] < price) {
        result = 'insufficient';
        return s;
      }
      return { ...s, [wallet]: s[wallet] - price, owned: [...new Set([...s.owned, ...items])] };
    });
    return result;
  }, []);

  const reserveClass = useCallback((classId) => {
    let reserved = false;
    setState((s) => {
      if (s.reserved.includes(classId)) return s;
      reserved = true;
      return { ...s, reserved: [...s.reserved, classId] };
    });
    return reserved;
  }, []);

  const value = useMemo(
    () => ({ ...state, toast, showToast, addReward, claimMission, buyItem, buyPack, reserveClass }),
    [state, toast, showToast, addReward, claimMission, buyItem, buyPack, reserveClass]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState debe usarse dentro de <AppStateProvider>');
  return context;
}

// El won no usa decimales y se muestra con separador de miles con punto.
export function formatWon(amount) {
  return amount.toLocaleString('es-CO');
}
