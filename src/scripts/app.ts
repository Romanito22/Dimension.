// Point d'entrée client : chargé une seule fois, réinitialise les pages
// à chaque navigation (astro:page-load) grâce au ClientRouter.
import { lenis, reducedMotion, lockScroll, unlockScroll, onScrollFrame, docTop } from './scroll';
import { initCartUI } from './cart-ui';
import { initShop } from './shop';
import { initProduct } from './product';
import { initCheckout } from './checkout';
import { initForms } from './forms';
import { initCarousels } from './carousel';
import { introDone, splitChars } from './effects';
import { initFlip, initScrub } from './home';
import { initDropViewer } from './dropviewer';
import { initQuickAdd } from './quickadd';
import { initTable } from './table';
import { initSearch } from './search';
import { initWish } from './wish';
import { initProductExtras } from './product-extras';

/* ---------- En-tête ---------- */
const header = document.querySelector<HTMLElement>('header[data-header]');
let lastY = window.scrollY;
function onScroll() {
  const y = window.scrollY;
  if (!header) return;
  header.classList.toggle('is-scrolled', y > 40);
  const goingDown = y > lastY + 4;
  const goingUp = y < lastY - 4;
  if (goingDown && y > 320) header.classList.add('is-hidden');
  else if (goingUp || y < 320) header.classList.remove('is-hidden');
  lastY = y;
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Menu mobile ---------- */
const menu = document.querySelector<HTMLElement>('[data-menu]');
const burger = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
function setMenu(open: boolean) {
  if (!menu || !burger) return;
  if (open === !menu.hidden) return;
  menu.hidden = !open;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  open ? lockScroll() : unlockScroll();
}
burger?.addEventListener('click', () => setMenu(!!menu?.hidden));
document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
document.addEventListener('astro:before-swap', () => setMenu(false));

/* ---------- Curseur ---------- */
const cursor = document.querySelector<HTMLElement>('.cursor');
const label = cursor?.querySelector<HTMLElement>('[data-cursor-label]');
if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let x = -100,
    y = -100,
    cx = -100,
    cy = -100;
  window.addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as HTMLElement;
      const labelled = t.closest<HTMLElement>('[data-cursor]');
      const interactive = t.closest('a, button, label, summary, [role="button"], input[type="radio"], input[type="checkbox"]');
      const text = t.closest('input:not([type="radio"]):not([type="checkbox"]), textarea, select');
      cursor.classList.toggle('is-label', !!labelled);
      cursor.classList.toggle('is-hover', !labelled && !!interactive);
      cursor.classList.toggle('is-hidden', !!text);
      if (label) label.textContent = labelled?.dataset.cursor ?? '';
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));
  let running = false;
  const tick = () => {
    const k = reducedMotion ? 1 : 0.24;
    cx += (x - cx) * k;
    cy += (y - cy) * k;
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    // Boucle active seulement tant que le curseur n'a pas rattrapé la souris.
    running = Math.abs(x - cx) + Math.abs(y - cy) > 0.3;
    if (running) requestAnimationFrame(tick);
  };
  window.addEventListener(
    'pointermove',
    () => {
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    },
    { passive: true },
  );
  document.addEventListener('astro:after-swap', () => cursor.classList.remove('is-label', 'is-hover'));
}

/* ---------- Apparitions au scroll ---------- */
function initReveal(signal: AbortSignal) {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal], [data-split], [data-chars]');
  if (!('IntersectionObserver' in window) || reducedMotion) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  // Un bloc « rideau » fermé (clip-path) a une surface visible nulle : l'observateur ne le
  // verrait jamais entrer. On observe donc son parent et on révèle le bloc lui-même.
  const targets = new Map<Element, HTMLElement[]>();
  els.forEach((el) => {
    const watched = el.dataset.reveal === 'clip' ? el.parentElement! : el;
    targets.set(watched, [...(targets.get(watched) ?? []), el]);
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          targets.get(e.target)?.forEach((el) => el.classList.add('is-in'));
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  targets.forEach((_, el) => io.observe(el));
  signal.addEventListener('abort', () => io.disconnect());
}

/* ---------- Parallaxe légère ---------- */
function initParallax(signal: AbortSignal) {
  const els = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map((el) => ({
    el,
    k: Number(el.dataset.parallax),
    top: 0,
    h: 0,
    last: NaN,
  }));
  if (!els.length || reducedMotion) return;
  let vh = window.innerHeight;
  onScrollFrame(
    (y) => {
      for (const it of els) {
        const top = it.top - y;
        if (top + it.h < -200 || top > vh + 200) continue;
        const offset = Math.round((top + it.h / 2 - vh / 2) * it.k * 2) / 2;
        if (offset === it.last) continue;
        it.last = offset;
        it.el.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
    },
    signal,
    () => {
      vh = window.innerHeight;
      for (const it of els) {
        it.top = docTop(it.el.parentElement!);
        it.h = it.el.parentElement!.offsetHeight;
      }
    },
  );
}

/* ---------- Navigation active ---------- */
function markActive() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach((a) => {
    const href = new URL(a.href).pathname.replace(/\/$/, '') || '/';
    const active = href !== '/' && (path === href || path.startsWith(href + '/'));
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.querySelectorAll<HTMLElement>('[data-tab]').forEach((a) => {
    const tab = a.dataset.tab!;
    const on = tab === '/' ? path === '/' : path === tab || (tab === '/boutique' && path.startsWith('/produit'));
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const isProduct = path.startsWith('/produit');
  if (isProduct) document.querySelector('[data-nav][href="/boutique"]')?.setAttribute('aria-current', 'page');
}

/* ---------- Grille de mise en page (touche G) ---------- */
document.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (e.key.toLowerCase() !== 'g' || e.metaKey || e.ctrlKey || t.closest('input, textarea, select, [contenteditable]')) return;
  document.documentElement.classList.toggle('show-grid');
});

/* ---------- Cycle de vie des pages ---------- */
initCartUI();
initQuickAdd();
initSearch();
initWish();
let controller: AbortController | null = null;

document.addEventListener('astro:page-load', () => {
  document.documentElement.classList.add('js');
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  lastY = window.scrollY;
  onScroll();
  markActive();
  splitChars();
  initReveal(signal);
  initDropViewer(signal, introDone);
  initScrub(signal);
  initTable(signal);
  initFlip(signal);
  initParallax(signal);
  initCarousels(signal);
  initForms(signal);
  initShop(signal);
  initProduct(signal);
  initProductExtras(signal);
  initCheckout(signal);

  document.querySelectorAll<HTMLAnchorElement>('[data-to-top]').forEach((a) =>
    a.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      { signal },
    ),
  );
});

document.addEventListener('astro:after-swap', () => document.documentElement.classList.add('js'));
