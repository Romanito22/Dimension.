import Lenis from 'lenis';

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lenis: Lenis | null = reducedMotion ? null : new Lenis({ lerp: 0.11, anchors: { offset: -110 } });

if (lenis) {
  const raf = (t: number) => {
    lenis.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

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
  if (!lenis) return;
  lenis.resize();
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
});
