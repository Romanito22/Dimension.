import Lenis from 'lenis';

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;

// Sur tactile, le défilement natif est déjà fluide (et inertiel) : Lenis seulement à la souris.
export const lenis: Lenis | null = reducedMotion || coarse ? null : new Lenis({ lerp: 0.12, anchors: { offset: -110 } });

/* ---------- Une seule boucle pour tous les effets liés au scroll ----------
   Chaque effet mesure sa géométrie une fois (au chargement et au redimensionnement),
   puis ne fait que des calculs à partir de scrollY : aucune lecture de mise en page
   pendant le défilement, donc aucun recalcul forcé. */
type Sub = (y: number) => void;
const subs = new Set<Sub>();
const measures = new Set<() => void>();
let queued = false;
function flush() {
  queued = false;
  const y = window.scrollY;
  subs.forEach((fn) => fn(y));
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(flush);
}
function remeasure() {
  measures.forEach((fn) => fn());
  queue();
}

if (lenis) {
  const raf = (t: number) => {
    lenis.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  // Appelé dans la même image que le déplacement : pas de décalage d'une image.
  lenis.on('scroll', flush);
} else {
  window.addEventListener('scroll', queue, { passive: true });
}
let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(remeasure, 120);
});
// La hauteur du document change (polices, contenu injecté) : on remesure.
new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(remeasure, 60);
}).observe(document.documentElement);

/** Abonne `update` au scroll ; `measure` relit la géométrie quand la page change. */
export function onScrollFrame(update: Sub, signal: AbortSignal, measure?: () => void) {
  subs.add(update);
  if (measure) {
    measures.add(measure);
    measure();
  }
  signal.addEventListener('abort', () => {
    subs.delete(update);
    if (measure) measures.delete(measure);
  });
  update(window.scrollY);
}

/** Position d'un élément dans le document (à appeler dans un `measure`). */
export const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

let locks = 0;
export function lockScroll() {
  locks++;
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
}
export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks) return;
  lenis?.start();
  document.documentElement.style.overflow = '';
}

// Après une navigation, Lenis se recale sur la position définie par le routeur.
document.addEventListener('astro:page-load', () => {
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  }
  remeasure();
});
