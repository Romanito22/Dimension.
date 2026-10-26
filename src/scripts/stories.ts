// Stories du drop : lecture plein écran, avance toute seule, touche à droite / à gauche,
// appui long pour mettre en pause, glisser vers le bas pour fermer.
import { openDialog } from './dialogs';
import { persisted } from '../lib/saved';
import { reducedMotion } from './scroll';

interface Slide {
  img: string;
  caption: string;
  cta?: { label: string; url: string };
}
interface Group {
  id: string;
  title: string;
  slides: Slide[];
}

const DURATION = 5000;
const $seen = persisted<string[]>('dimension-stories-seen-v1', []);

export function initStories(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-stories]');
  const dialog = document.querySelector<HTMLDialogElement>('[data-story-dialog]');
  if (!root || !dialog) return;
  const groups = JSON.parse(root.querySelector('[data-stories-json]')!.textContent || '[]') as Group[];
  const stage = dialog.querySelector<HTMLElement>('[data-story-stage]')!;
  const img = dialog.querySelector<HTMLImageElement>('[data-story-img]')!;
  const bg = dialog.querySelector<HTMLImageElement>('[data-story-bg]')!;
  const bars = dialog.querySelector<HTMLElement>('[data-story-bars]')!;
  const title = dialog.querySelector<HTMLElement>('[data-story-title]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-story-caption]')!;
  const cta = dialog.querySelector<HTMLAnchorElement>('[data-story-cta]')!;
  const bubbles = [...root.querySelectorAll<HTMLButtonElement>('[data-story]')];

  let g = 0;
  let s = 0;
  let timer = 0;
  let started = 0;
  let left = DURATION;

  const markSeen = () => bubbles.forEach((b) => b.classList.toggle('is-seen', $seen.get().includes(b.dataset.storyId!)));
  markSeen();

  function schedule(ms: number) {
    clearTimeout(timer);
    started = performance.now();
    left = ms;
    timer = window.setTimeout(next, ms);
  }

  function show() {
    const group = groups[g];
    const slide = group.slides[s];
    title.textContent = group.title;
    img.src = slide.img;
    bg.src = slide.img;
    img.alt = slide.caption;
    caption.textContent = slide.caption;
    cta.hidden = !slide.cta;
    if (slide.cta) {
      cta.href = slide.cta.url;
      cta.textContent = slide.cta.label;
    }
    bars.innerHTML = group.slides.map((_, i) => `<span class="${i < s ? 'is-done' : i === s ? 'is-now' : ''}"><i></i></span>`).join('');
    stage.style.setProperty('--story-dur', `${DURATION}ms`);
    stage.classList.remove('is-paused');
    // Image suivante préchargée
    const nxt = group.slides[s + 1] ?? groups[g + 1]?.slides[0];
    if (nxt) new Image().src = nxt.img;
    if (!$seen.get().includes(group.id)) $seen.set([...$seen.get(), group.id]);
    if (!reducedMotion) schedule(DURATION);
  }

  function next() {
    if (s < groups[g].slides.length - 1) s++;
    else if (g < groups.length - 1) {
      g++;
      s = 0;
    } else return dialog!.close();
    show();
  }
  function prev() {
    if (s > 0) s--;
    else if (g > 0) {
      g--;
      s = groups[g].slides.length - 1;
    }
    show();
  }

  root.addEventListener(
    'click',
    (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-story]');
      if (!b) return;
      g = Number(b.dataset.story);
      s = 0;
      openDialog(dialog, b);
      show();
    },
    { signal },
  );
  dialog.addEventListener(
    'close',
    () => {
      clearTimeout(timer);
      markSeen();
    },
    { signal },
  );
  dialog.querySelector('[data-story-next]')!.addEventListener('click', next, { signal });
  dialog.querySelector('[data-story-prev]')!.addEventListener('click', prev, { signal });
  dialog.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    },
    { signal },
  );

  // Appui long : pause ; glisser vers le bas : fermer
  let y0 = 0;
  stage.addEventListener(
    'pointerdown',
    (e) => {
      if ((e.target as HTMLElement).closest('a, [data-close]')) return;
      y0 = e.clientY;
      clearTimeout(timer);
      left = Math.max(300, left - (performance.now() - started));
      stage.classList.add('is-paused');
    },
    { signal },
  );
  const release = (e: PointerEvent) => {
    if (!stage.classList.contains('is-paused')) return;
    stage.classList.remove('is-paused');
    if (e.clientY - y0 > 90) return dialog.close();
    // On reprend là où on s'était arrêté (un toucher court sur les côtés passe ensuite à suivant / précédent)
    if (!reducedMotion) schedule(left);
  };
  stage.addEventListener('pointerup', release, { signal });
  stage.addEventListener('pointercancel', release, { signal });
  signal.addEventListener('abort', () => clearTimeout(timer));
}
