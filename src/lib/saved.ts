// Préférences enregistrées dans le navigateur : favoris, pièces vues récemment, taille conseillée.
import { atom } from 'nanostores';

export function persisted<T>(key: string, fallback: T) {
  let initial = fallback;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      if (raw) initial = JSON.parse(raw) as T;
    } catch {
      /* stockage indisponible */
    }
  }
  const store = atom<T>(initial);
  store.listen((v) => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key || !e.newValue) return;
      try {
        store.set(JSON.parse(e.newValue) as T);
      } catch {
        /* ignore */
      }
    });
  }
  return store;
}

export const $wishlist = persisted<string[]>('dimension-wish-v1', []);
export const $recent = persisted<string[]>('dimension-recent-v1', []);
export const $mySize = persisted<string>('dimension-size-v1', '');
/** E-mail saisi une fois (newsletter, commande, alerte, avis, suivi) : pré-rempli partout ensuite. */
export const $email = persisted<string>('dimension-email-v1', '');
/** Alertes de réassort demandées (pièce + taille), affichées dans « Mon espace ». */
export const $alerts = persisted<{ id: string; size: string; date: string }[]>('dimension-alerts-v1', []);
/** Message de bienvenue déjà vu ou fermé */
export const $welcomed = persisted<boolean>('dimension-welcome-v1', false);

/** Efface tout ce que le site a gardé sur cet appareil (panier compris). */
export function forgetEverything() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('dimension-'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function toggleWish(id: string) {
  const list = $wishlist.get();
  const on = !list.includes(id);
  $wishlist.set(on ? [id, ...list] : list.filter((x) => x !== id));
  return on;
}

export function pushRecent(id: string) {
  $recent.set([id, ...$recent.get().filter((x) => x !== id)].slice(0, 8));
}
