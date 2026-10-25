// Table de travail : les pièces posées sur le gravier se déplacent au doigt ou à la souris,
// avec un peu d'inertie. Un simple clic (sans glisser) ouvre la pièce.
import { reducedMotion } from './scroll';

export function initTable(signal: AbortSignal) {
  const stage = document.querySelector<HTMLElement>('[data-table-stage]');
  if (!stage) return;
  let top = 100;

  stage.querySelectorAll<HTMLElement>('[data-drag]').forEach((el) => {
    let x = 0,
      y = 0,
      startX = 0,
      startY = 0,
      baseX = 0,
      baseY = 0,
      vx = 0,
      vy = 0,
      lastX = 0,
      lastY = 0,
      lastT = 0,
      moved = 0,
      dragging = false,
      raf = 0;
    const r0 = parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0;
    let rot = r0;

    const apply = () => {
      el.style.setProperty('--dx', `${x.toFixed(1)}px`);
      el.style.setProperty('--dy', `${y.toFixed(1)}px`);
      el.style.setProperty('--r', `${rot.toFixed(2)}deg`);
    };

    el.addEventListener(
      'pointerdown',
      (e) => {
        if (e.button !== 0) return;
        cancelAnimationFrame(raf);
        dragging = true;
        moved = 0;
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        lastT = performance.now();
        baseX = x;
        baseY = y;
        vx = vy = 0;
        el.setPointerCapture(e.pointerId);
        el.classList.add('is-grabbing');
        el.style.setProperty('--z', String(++top));
      },
      { signal },
    );
    el.addEventListener(
      'pointermove',
      (e) => {
        if (!dragging) return;
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        vx = ((e.clientX - lastX) / dt) * 16;
        vy = ((e.clientY - lastY) / dt) * 16;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
        x = baseX + e.clientX - startX;
        y = baseY + e.clientY - startY;
        moved = Math.max(moved, Math.hypot(e.clientX - startX, e.clientY - startY));
        rot = r0 + Math.max(-12, Math.min(12, vx * 0.6));
        apply();
      },
      { signal },
    );
    const release = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-grabbing');
      const stageR = stage.getBoundingClientRect();
      const glide = () => {
        if (reducedMotion) {
          rot = r0;
          apply();
          return;
        }
        vx *= 0.92;
        vy *= 0.92;
        x += vx;
        y += vy;
        // Rester à peu près sur la table
        const r = el.getBoundingClientRect();
        if (r.left < stageR.left - r.width * 0.3 || r.right > stageR.right + r.width * 0.3) vx *= -0.5;
        if (r.top < stageR.top - r.height * 0.2 || r.bottom > stageR.bottom + r.height * 0.2) vy *= -0.5;
        rot += (r0 - rot) * 0.1;
        apply();
        if (Math.abs(vx) + Math.abs(vy) > 0.3 || Math.abs(rot - r0) > 0.1) raf = requestAnimationFrame(glide);
      };
      raf = requestAnimationFrame(glide);
    };
    el.addEventListener('pointerup', release, { signal });
    el.addEventListener('pointercancel', release, { signal });
    // Un glisser ne doit pas ouvrir la page produit
    el.addEventListener(
      'click',
      (e) => {
        if (moved > 6) e.preventDefault();
      },
      { signal },
    );
    el.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
    signal.addEventListener('abort', () => cancelAnimationFrame(raf));
  });
}
