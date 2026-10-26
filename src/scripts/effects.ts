// Effets globaux : intro, inclinaison 3D des cartes, boutons aimantés,
// titres révélés lettre par lettre.
import { reducedMotion } from './scroll';

const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Intro (première visite de la session) ---------- */
export const introDone = new Promise<void>((resolve) => {
  const html = document.documentElement;
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  if (!html.classList.contains('is-loading') || !loader) return resolve();
  const counter = loader.querySelector<HTMLElement>('[data-loader-count]');
  const start = performance.now();
  const DURATION = 1000;
  const tick = (t: number) => {
    const p = Math.min(1, (t - start) / DURATION);
    const eased = 1 - Math.pow(1 - p, 3);
    if (counter) counter.textContent = String(Math.round(eased * 100)).padStart(3, '0');
    if (p < 1) requestAnimationFrame(tick);
    else {
      const fonts = document.fonts?.ready ?? Promise.resolve();
      fonts.then(() => {
        loader.classList.add('is-out');
        setTimeout(resolve, 300);
        setTimeout(() => {
          html.classList.remove('is-loading');
          try {
            sessionStorage.setItem('dim-intro', '1');
          } catch {
            /* ignore */
          }
        }, 900);
      });
    }
  };
  requestAnimationFrame(tick);
});

/* ---------- Cartes inclinables + boutons aimantés ---------- */
if (fine && !reducedMotion) {
  let tiltEl: HTMLElement | null = null;
  let magEl: HTMLElement | null = null;

  const resetTilt = (el: HTMLElement) => {
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--go', '0');
  };
  const resetMag = (el: HTMLElement) => {
    el.style.translate = '';
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      const t = e.target as HTMLElement;
      const tilt = t.closest<HTMLElement>('[data-tilt]');
      if (tiltEl && tiltEl !== tilt) resetTilt(tiltEl);
      tiltEl = tilt;
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        tilt.style.setProperty('--rx', `${((0.5 - y) * 9).toFixed(2)}deg`);
        tilt.style.setProperty('--ry', `${((x - 0.5) * 11).toFixed(2)}deg`);
        tilt.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        tilt.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
        tilt.style.setProperty('--go', '1');
      }

      const mag = t.closest<HTMLElement>('.btn, .arrow, [data-magnetic]');
      if (magEl && magEl !== mag) resetMag(magEl);
      magEl = mag;
      if (mag && !mag.closest('.drawer, dialog, .filters')) {
        const r = mag.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        mag.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px`;
      }
    },
    { passive: true },
  );
  document.addEventListener('astro:before-swap', () => {
    tiltEl = null;
    magEl = null;
  });
}

/* ---------- Titres révélés lettre par lettre ---------- */
export function splitChars() {
  document.querySelectorAll<HTMLElement>('[data-chars]:not([data-split-done])').forEach((el) => {
    el.dataset.splitDone = '';
    el.setAttribute('aria-label', el.textContent!.replace(/\s+/g, ' ').trim());
    let i = 0;
    const walk = (node: Node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent!.split(/(\s+)/).forEach((word) => {
            if (!word) return;
            if (/^\s+$/.test(word)) {
              frag.append(' ');
              return;
            }
            const w = document.createElement('span');
            w.className = 'w';
            w.setAttribute('aria-hidden', 'true');
            [...word].forEach((c) => {
              const ch = document.createElement('span');
              ch.className = 'ch';
              ch.style.setProperty('--ci', String(i++));
              ch.textContent = c;
              w.append(ch);
            });
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && !(child as HTMLElement).classList.contains('dot')) {
          walk(child);
        }
      });
    };
    walk(el);
  });
}

/* ---------- Rideau framboise entre les pages ---------- */
const wipe = document.querySelector<HTMLElement>('[data-wipe]');
if (wipe && !reducedMotion) {
  let covering = false;
  document.addEventListener('astro:before-preparation', (e) => {
    const ev = e as Event & { to: URL; from: URL; loader: () => Promise<void> };
    if (ev.to.pathname === ev.from.pathname) return; // ancre dans la même page
    const load = ev.loader;
    ev.loader = async () => {
      covering = true;
      wipe.classList.remove('is-out');
      void wipe.offsetWidth;
      wipe.classList.add('is-in');
      await Promise.all([load(), new Promise((r) => setTimeout(r, 300))]);
    };
  });
  document.addEventListener('astro:after-swap', () => {
    if (!covering) return;
    covering = false;
    wipe.classList.replace('is-in', 'is-out');
    setTimeout(() => wipe.classList.remove('is-out'), 450);
  });

  // Chargement complet (changement de langue, ou site sans routeur) : le rideau tombe
  // avant de quitter la page, et se relève à l'arrivée (voir le script en tête de Base).
  const routed = !!document.querySelector('meta[name="astro-view-transitions-enabled"]');
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (routed && !a.hasAttribute('data-astro-reload')) return;
    if (a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
    const url = new URL(a.href);
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    try {
      sessionStorage.setItem('dim-wipe', '1');
    } catch {
      /* ignore */
    }
    wipe.classList.remove('is-out');
    void wipe.offsetWidth;
    wipe.classList.add('is-in');
    setTimeout(() => (location.href = a.href), 300);
  });
  if (document.documentElement.classList.contains('wipe-cover')) {
    wipe.classList.add('is-in');
    document.documentElement.classList.remove('wipe-cover');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        wipe.classList.replace('is-in', 'is-out');
        setTimeout(() => wipe.classList.remove('is-out'), 450);
      }),
    );
  }
  // Retour arrière depuis le cache du navigateur : jamais de rideau resté baissé
  window.addEventListener('pageshow', (e) => e.persisted && wipe.classList.remove('is-in'));
}
