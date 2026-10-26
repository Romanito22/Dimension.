// dimension. comme une app : service worker (pages déjà vues hors ligne, visites plus rapides)
// et proposition d'installation sur l'écran d'accueil, au bon moment et sans insister.
import { persisted } from '../lib/saved';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPrompt | null = null;
const $dismissed = persisted<boolean>('dimension-install-later-v1', false);

const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const returning = () => {
  try {
    return !!sessionStorage.getItem('dim-prev-visit');
  } catch {
    return false;
  }
};

function refresh() {
  const installed = standalone();
  document.querySelectorAll<HTMLElement>('[data-install-card]').forEach((card) => {
    const always = card.dataset.installCard === 'always';
    // Accueil : seulement pour les habitués, une fois, tant que l'installation est possible
    card.hidden = installed || (!always && ($dismissed.get() || !returning() || !deferred)) || (always && !deferred && !ios());
  });
  document.querySelectorAll<HTMLElement>('[data-install]').forEach((b) => (b.hidden = !deferred));
  document.querySelectorAll<HTMLElement>('[data-install-ios]').forEach((el) => (el.hidden = !(ios() && !deferred && !installed)));
}

export function initInstall() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    const root = document.querySelector<HTMLMetaElement>('meta[name="dim-root"]')?.content ?? '/';
    const register = () => navigator.serviceWorker.register(`${root}sw.js`).catch(() => {});
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    refresh();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    refresh();
  });
  document.addEventListener('click', async (e) => {
    const el = e.target as HTMLElement;
    if (el.closest('[data-install]') && deferred) {
      const p = deferred;
      deferred = null;
      await p.prompt();
      await p.userChoice.catch(() => null);
      refresh();
    } else if (el.closest('[data-install-later]')) {
      $dismissed.set(true);
      refresh();
    }
  });
  document.addEventListener('astro:page-load', refresh);
}
