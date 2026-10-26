// Fiche produit : vue 3D / 360° qu'on fait tourner au doigt, et formulaire d'avis.
import { reducedMotion } from './scroll';
import { validateAll } from './forms';
import { t } from './i18n';

function initSpin(signal: AbortSignal) {
  const dialog = document.querySelector<HTMLDialogElement>('[data-spin]');
  if (!dialog) return;
  const stage = dialog.querySelector<HTMLElement>('[data-spin-stage]')!;
  const card = dialog.querySelector<HTMLElement>('[data-spin-card]');
  const frameImg = dialog.querySelector<HTMLImageElement>('[data-spin-frame]');
  const range = dialog.querySelector<HTMLInputElement>('[data-spin-range]')!;
  const frames = JSON.parse(stage.dataset.frames || '[]') as string[];

  // Photos 360° : préchargées à l'ouverture
  let preloaded = false;
  const preload = () => {
    if (preloaded) return;
    preloaded = true;
    frames.forEach((src) => (new Image().src = src));
  };

  let angle = 0;
  let tilt = 0;
  let vel = 0;
  let auto = true;
  let raf = 0;
  const norm = (a: number) => ((a % 360) + 360) % 360;

  function draw() {
    const a = norm(angle);
    range.value = String(Math.round(a));
    if (frameImg && frames.length) {
      const i = Math.round((a / 360) * frames.length) % frames.length;
      if (!frameImg.src.endsWith(frames[i])) frameImg.src = frames[i];
    } else if (card) {
      // La pièce est plate : on s'attarde devant et dos, et on passe vite la tranche.
      const shown = a - 20 * Math.sin((2 * a * Math.PI) / 180);
      card.style.transform = `rotateX(${tilt.toFixed(2)}deg) rotateY(${shown.toFixed(2)}deg)`;
    }
  }
  function loop() {
    raf = 0;
    if (!dialog!.open) return;
    if (auto && !reducedMotion) angle += 0.35;
    else if (Math.abs(vel) > 0.05) {
      angle += vel;
      vel *= 0.94;
    }
    draw();
    if (auto || Math.abs(vel) > 0.05) raf = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  // Glisser pour tourner (souris et doigt), avec inertie
  let dragging = false;
  let lastX = 0;
  stage.addEventListener(
    'pointerdown',
    (e) => {
      dragging = true;
      auto = false;
      vel = 0;
      lastX = e.clientX;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
    },
    { signal },
  );
  stage.addEventListener(
    'pointermove',
    (e) => {
      const r = stage.getBoundingClientRect();
      tilt = ((e.clientY - r.top) / r.height - 0.5) * -10;
      if (dragging) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        angle += dx * 0.6;
        vel = dx * 0.6;
      }
      draw();
    },
    { signal },
  );
  const release = () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    kick();
  };
  stage.addEventListener('pointerup', release, { signal });
  stage.addEventListener('pointercancel', release, { signal });

  range.addEventListener(
    'input',
    () => {
      auto = false;
      vel = 0;
      angle = Number(range.value);
      draw();
    },
    { signal },
  );

  // Devant / Dos : rotation animée jusqu'à l'angle voulu
  function turnTo(target: number) {
    auto = false;
    vel = 0;
    const from = norm(angle);
    let delta = target - from;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 600);
      angle = from + delta * (1 - Math.pow(1 - p, 3));
      draw();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  dialog.addEventListener(
    'click',
    (e) => {
      const to = (e.target as HTMLElement).closest<HTMLElement>('[data-spin-to]');
      if (to) turnTo(Number(to.dataset.spinTo));
    },
    { signal },
  );
  // Ouverture et fermeture : voir dialogs.ts
  dialog.addEventListener(
    'dialog:open',
    () => {
      preload();
      angle = 0;
      auto = true;
      draw();
      kick();
    },
    { signal },
  );
}

function initReviewForm(signal: AbortSignal) {
  const dialog = document.querySelector<HTMLDialogElement>('[data-review-dialog]');
  if (!dialog) return;
  const form = dialog.querySelector<HTMLFormElement>('[data-review-form]')!;
  const ok = dialog.querySelector<HTMLElement>('[data-review-ok]')!;
  const ratingErr = dialog.querySelector<HTMLElement>('[data-rating-error]')!;
  form.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      const rated = !!form.querySelector('input[name="rating"]:checked');
      ratingErr.textContent = rated ? '' : t('Choisis une note de 1 à 5.', 'Pick a rating from 1 to 5.');
      const valid = validateAll(form);
      if (!rated || !valid) return;
      // Envoi simulé : à relier à l'outil d'avis (Judge.me, Trustpilot, Google…).
      form.hidden = true;
      ok.hidden = false;
      ok.focus();
    },
    { signal },
  );
}

export function initProductMedia(signal: AbortSignal) {
  if (!document.querySelector('[data-product]')) return;
  initSpin(signal);
  initReviewForm(signal);
}
