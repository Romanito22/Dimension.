// Accueil : hero interactif, nouveautés en défilement horizontal, pièce signature qui se retourne.
import { reducedMotion } from './scroll';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ---------- Hero ---------- */
export function initHero(signal: AbortSignal, introDone: Promise<void>) {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  introDone.then(() => requestAnimationFrame(() => hero.classList.add('is-ready')));
  if (reducedMotion) return;

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let tx = 0,
    ty = 0,
    mx = 0,
    my = 0;
  let bx = innerWidth / 2,
    by = innerHeight / 2,
    tbx = bx,
    tby = by;
  let visible = true;
  let raf = 0;

  hero.addEventListener(
    'pointermove',
    (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      tbx = e.clientX - r.left;
      tby = e.clientY - r.top;
    },
    { signal, passive: true },
  );
  hero.addEventListener(
    'pointerleave',
    () => {
      tx = 0;
      ty = 0;
    },
    { signal },
  );

  const loop = (t: number) => {
    if (!fine) {
      // Sur mobile : léger mouvement autonome
      tx = Math.sin(t / 2200) * 0.5;
      ty = Math.cos(t / 2900) * 0.35;
      tbx = innerWidth * (0.5 + Math.sin(t / 3100) * 0.3);
      tby = innerHeight * (0.5 + Math.cos(t / 2700) * 0.25);
    }
    mx += (tx - mx) * 0.07;
    my += (ty - my) * 0.07;
    bx += (tbx - bx) * 0.06;
    by += (tby - by) * 0.06;
    const sp = clamp(window.scrollY / hero.offsetHeight);
    hero.style.setProperty('--mx', mx.toFixed(4));
    hero.style.setProperty('--my', my.toFixed(4));
    hero.style.setProperty('--sp', sp.toFixed(4));
    hero.style.setProperty('--bx', `${bx.toFixed(1)}px`);
    hero.style.setProperty('--by', `${by.toFixed(1)}px`);
    raf = visible ? requestAnimationFrame(loop) : 0;
  };
  raf = requestAnimationFrame(loop);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  });
  io.observe(hero);
  signal.addEventListener('abort', () => {
    io.disconnect();
    cancelAnimationFrame(raf);
  });
}

/* ---------- Nouveautés : défilement horizontal épinglé ---------- */
export function initHScroll(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-hscroll]');
  if (!root) return;
  const track = root.querySelector<HTMLElement>('[data-hs-track]')!;
  const viewport = track.parentElement!;
  const bar = root.querySelector<HTMLElement>('[data-hs-progress]');
  const mq = window.matchMedia('(min-width: 861px)');
  let overflow = 0;
  let pinned = false;

  function setup() {
    pinned = mq.matches && !reducedMotion;
    root!.classList.toggle('is-pinned', pinned);
    track.style.transform = '';
    if (pinned) {
      overflow = Math.max(0, track.scrollWidth - innerWidth);
      root!.style.height = `${overflow + innerHeight}px`;
    } else {
      root!.style.height = '';
    }
    update();
  }
  function update() {
    let p: number;
    if (pinned) {
      const total = root!.offsetHeight - innerHeight;
      p = total > 0 ? clamp(-root!.getBoundingClientRect().top / total) : 0;
      track.style.transform = `translate3d(${(-p * overflow).toFixed(1)}px, 0, 0)`;
    } else {
      const max = viewport.scrollWidth - viewport.clientWidth;
      p = max > 0 ? viewport.scrollLeft / max : 0;
    }
    if (bar) bar.style.transform = `scaleX(${Math.max(0.04, p)})`;
  }
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true, signal });
  viewport.addEventListener('scroll', onScroll, { passive: true, signal });
  window.addEventListener('resize', setup, { signal });
  mq.addEventListener('change', setup, { signal });
  document.fonts?.ready.then(setup);
  setup();
}

/* ---------- Pièce signature : devant / dos ---------- */
export function initFlip(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-flip]');
  if (!root) return;
  const card = root.querySelector<HTMLElement>('[data-flip-card]')!;
  const steps = [...root.querySelectorAll<HTMLElement>('[data-flip-step]')];
  const side = root.querySelector<HTMLElement>('[data-flip-side]');
  const count = root.querySelector<HTMLElement>('[data-flip-count]');
  let last = -1;

  function update() {
    const total = root!.offsetHeight - innerHeight;
    const p = total > 0 ? clamp(-root!.getBoundingClientRect().top / total) : 0;
    root!.style.setProperty('--fp', p.toFixed(4));
    const rot = smooth(0.5, 0.7, p) * 180;
    card.style.setProperty('--rot', rot.toFixed(2));
    const step = p < 0.3 ? 0 : p < 0.6 ? 1 : 2;
    if (step !== last) {
      last = step;
      root!.dataset.step = String(step);
      steps.forEach((s, i) => s.classList.toggle('is-active', i === step));
      if (count) count.textContent = `0${step + 1}`;
    }
    if (side) side.textContent = rot > 90 ? 'Dos' : 'Devant';
  }
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    },
    { passive: true, signal },
  );
  window.addEventListener('resize', update, { signal });
  update();
}
