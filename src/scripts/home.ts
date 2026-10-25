// Accueil : pièce signature qui se retourne, manifeste qui s'allume mot par mot.
import { reducedMotion, onScrollFrame, docTop } from './scroll';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Progression 0 → 1 d'une section épinglée, à partir de sa géométrie mise en cache. */
function pinned(root: HTMLElement) {
  const g = { top: 0, total: 1 };
  return {
    measure: () => {
      g.top = docTop(root);
      g.total = Math.max(1, root.offsetHeight - window.innerHeight);
    },
    progress: (y: number) => clamp((y - g.top) / g.total),
  };
}

/* ---------- Pièce signature : devant / dos ---------- */
export function initFlip(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-flip]');
  if (!root) return;
  const card = root.querySelector<HTMLElement>('[data-flip-card]')!;
  const steps = [...root.querySelectorAll<HTMLElement>('[data-flip-step]')];
  const side = root.querySelector<HTMLElement>('[data-flip-side]');
  const count = root.querySelector<HTMLElement>('[data-flip-count]');
  const pin = pinned(root);
  let last = -1;
  let lastP = -1;

  onScrollFrame(
    (y) => {
      const p = pin.progress(y);
      if (Math.abs(p - lastP) < 0.0005) return;
      lastP = p;
      root.style.setProperty('--fp', p.toFixed(4));
      const rot = smooth(0.45, 0.7, p) * 180;
      card.style.transform = `rotateY(${rot.toFixed(2)}deg) rotateX(6deg) rotateZ(${(-4 + p * 8).toFixed(2)}deg)`;
      const step = p < 0.3 ? 0 : p < 0.6 ? 1 : 2;
      if (step !== last) {
        last = step;
        root.dataset.step = String(step);
        steps.forEach((s, i) => s.classList.toggle('is-active', i === step));
        if (count) count.textContent = `0${step + 1}`;
      }
      if (side) {
        const label = rot > 90 ? 'Dos' : 'Devant';
        if (side.textContent !== label) side.textContent = label;
      }
    },
    signal,
    pin.measure,
  );
}

/* ---------- Manifeste : les mots s'allument au scroll ---------- */
export function initScrub(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-scrub]');
  if (!root) return;
  const words = [...root.querySelectorAll<HTMLElement>('.mf__w')];
  const pin = pinned(root);
  let lit = -1;
  onScrollFrame(
    (y) => {
      const n = reducedMotion ? words.length : Math.round(smooth(0.05, 0.8, pin.progress(y)) * words.length);
      if (n === lit) return;
      // Seuls les mots qui changent d'état sont touchés.
      const from = Math.min(n, Math.max(lit, 0));
      const to = Math.max(n, lit);
      for (let i = from; i < to; i++) words[i]?.classList.toggle('is-lit', i < n);
      lit = n;
    },
    signal,
    pin.measure,
  );
}
