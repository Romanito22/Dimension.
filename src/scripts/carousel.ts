// Carrousel horizontal : scroll natif + snap, glisser à la souris, flèches et progression.
export function initCarousels(signal: AbortSignal) {
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
    const track = root.querySelector<HTMLElement>('[data-track]');
    if (!track) return;
    const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
    const next = root.querySelector<HTMLButtonElement>('[data-next]');
    const progress = root.querySelector<HTMLElement>('[data-progress]');

    const step = () => {
      const item = track.firstElementChild as HTMLElement | null;
      return item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0') : track.clientWidth;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const pct = max > 0 ? track.scrollLeft / max : 0;
      if (progress) progress.style.transform = `scaleX(${Math.max(0.08, pct)})`;
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
    };
    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }), { signal });
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }), { signal });
    track.addEventListener('scroll', update, { passive: true, signal });
    window.addEventListener('resize', update, { signal });
    update();

    // Glisser à la souris (le tactile utilise le scroll natif)
    let down = false;
    let moved = 0;
    let startX = 0;
    let startLeft = 0;
    track.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true;
        moved = 0;
        startX = e.clientX;
        startLeft = track.scrollLeft;
        track.classList.add('is-grabbing');
      },
      { signal },
    );
    window.addEventListener(
      'pointermove',
      (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        if (moved > 4) track.style.scrollSnapType = 'none';
        track.scrollLeft = startLeft - dx;
      },
      { signal },
    );
    window.addEventListener(
      'pointerup',
      () => {
        if (!down) return;
        down = false;
        track.classList.remove('is-grabbing');
        const s = step();
        const target = Math.round(track.scrollLeft / s) * s;
        track.scrollTo({ left: target, behavior: 'smooth' });
        setTimeout(() => (track.style.scrollSnapType = ''), 450);
      },
      { signal },
    );
    track.addEventListener(
      'click',
      (e) => {
        if (moved > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { capture: true, signal },
    );
    track.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
  });
}
