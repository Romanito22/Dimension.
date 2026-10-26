// Fiche produit : couleur, taille, stock, ajout au panier, galerie (zoom,
// plein écran, swipe), guide des tailles, barre d'achat collante.
import { addItem, openDrawer } from '../lib/cart';
import { openDialog } from './dialogs';
import { t } from './i18n';

interface ProductData {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  sizes: { size: string; stock: number }[];
  low: number;
}

export function initProduct(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-product]');
  if (!root) return;
  const data = JSON.parse(root.querySelector('[data-product-json]')!.textContent!) as ProductData;

  const stockEl = root.querySelector<HTMLElement>('[data-stock]')!;
  const errEl = root.querySelector<HTMLElement>('[data-size-error]')!;
  const colorLabel = root.querySelector<HTMLElement>('[data-color-label]');
  const sizeLabel = root.querySelector<HTMLElement>('[data-size-label]');
  const addBtns = document.querySelectorAll<HTMLButtonElement>('[data-add]');
  const sizeset = root.querySelector<HTMLElement>('[data-sizes]')!;

  const getSize = () => root.querySelector<HTMLInputElement>('input[name="size"]:checked')?.value ?? '';
  const getColor = () => root.querySelector<HTMLInputElement>('input[name="color"]:checked')?.value ?? '';

  function updateStock() {
    const size = getSize();
    if (sizeLabel) sizeLabel.textContent = size || '—';
    const s = data.sizes.find((x) => x.size === size);
    stockEl.classList.remove('is-low', 'is-ok');
    if (!s) {
      stockEl.textContent = t('Choisis ta taille', 'Pick your size');
      return;
    }
    errEl.textContent = '';
    sizeset.classList.remove('is-error');
    if (s.stock <= data.low) {
      stockEl.textContent = t(`Plus que ${s.stock} en ${size}`, `Only ${s.stock} left in ${size}`);
      stockEl.classList.add('is-low');
    } else {
      stockEl.textContent = t('En stock, prêt à partir sous 48 h', 'In stock, ready to ship within 48 h');
      stockEl.classList.add('is-ok');
    }
    addBtns.forEach((b) => (b.querySelector('[data-add-label]')!.textContent = t('Ajouter au panier', 'Add to bag')));
  }

  root.addEventListener(
    'change',
    (e) => {
      const t = e.target as HTMLInputElement;
      if (t.name === 'size') updateStock();
      if (t.name === 'color' && colorLabel) colorLabel.textContent = getColor();
    },
    { signal },
  );

  addBtns.forEach((btn) =>
    btn.addEventListener(
      'click',
      () => {
        const size = getSize();
        if (!size) {
          errEl.textContent = t('Sélectionne une taille pour continuer.', 'Select a size to continue.');
          sizeset.classList.remove('is-error');
          void sizeset.offsetWidth;
          sizeset.classList.add('is-error');
          sizeset.scrollIntoView({ block: 'center', behavior: 'smooth' });
          sizeset.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus({ preventScroll: true });
          return;
        }
        const s = data.sizes.find((x) => x.size === size)!;
        addItem({
          id: data.id,
          slug: data.slug,
          name: data.name,
          price: data.price,
          color: getColor(),
          size,
          max: s.stock,
          image: new URL(data.image, location.href).href,
        });
        btn.classList.add('is-added');
        btn.querySelector('[data-add-label]')!.textContent = t('Ajouté ✓', 'Added ✓');
        setTimeout(() => {
          btn.classList.remove('is-added');
          btn.querySelector('[data-add-label]')!.textContent = t('Ajouter au panier', 'Add to bag');
        }, 1600);
        setTimeout(openDrawer, 250);
      },
      { signal },
    ),
  );

  /* ---- Barre collante mobile ---- */
  const sticky = document.querySelector<HTMLElement>('[data-sticky]');
  const mainBtn = root.querySelector<HTMLElement>('[data-add-main]');
  if (sticky && mainBtn && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => sticky.classList.toggle('is-visible', !e.isIntersecting && e.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(mainBtn);
    signal.addEventListener('abort', () => io.disconnect());
  }

  /* ---- Galerie : zoom au survol ---- */
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.querySelectorAll<HTMLElement>('[data-zoom]').forEach((fig) => {
    const img = fig.querySelector('img')!;
    if (fine) {
      fig.addEventListener(
        'pointermove',
        (e) => {
          const r = fig.getBoundingClientRect();
          img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
          fig.classList.add('is-zoomed');
        },
        { signal },
      );
      fig.addEventListener('pointerleave', () => fig.classList.remove('is-zoomed'), { signal });
    }
    fig.addEventListener('click', () => openLightbox(Number(fig.dataset.zoom)), { signal });
    fig.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(Number(fig.dataset.zoom));
        }
      },
      { signal },
    );
  });

  /* ---- Galerie mobile : compteur ---- */
  const track = root.querySelector<HTMLElement>('[data-gallery-track]');
  const counter = root.querySelector<HTMLElement>('[data-gallery-counter]');
  const dots = root.querySelectorAll<HTMLElement>('[data-gallery-dot]');
  track?.addEventListener(
    'scroll',
    () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (counter) counter.textContent = String(i + 1);
      dots.forEach((d, j) => d.classList.toggle('is-active', i === j));
    },
    { passive: true, signal },
  );

  /* ---- Plein écran ---- */
  const lb = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  const lbImg = lb?.querySelector<HTMLImageElement>('[data-lightbox-img]');
  const lbCount = lb?.querySelector<HTMLElement>('[data-lightbox-count]');
  const sources = [...root.querySelectorAll<HTMLImageElement>('[data-zoom] img')].map((i) => ({ src: i.src, alt: i.alt }));
  let current = 0;
  function show(i: number) {
    current = (i + sources.length) % sources.length;
    if (!lbImg) return;
    lbImg.src = sources[current].src;
    lbImg.alt = sources[current].alt;
    lbImg.classList.remove('is-zoomed');
    if (lbCount) lbCount.textContent = `${current + 1} / ${sources.length}`;
  }
  function openLightbox(i: number) {
    if (!lb) return;
    show(i);
    openDialog(lb);
  }
  lb?.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-lb-prev]')) show(current - 1);
      else if (t.closest('[data-lb-next]')) show(current + 1);
      else if (t === lbImg) lbImg.classList.toggle('is-zoomed');
    },
    { signal },
  );
  lb?.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    },
    { signal },
  );
  let sx = 0;
  lb?.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true, signal });
  lb?.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    },
    { signal },
  );
  lb?.addEventListener(
    'pointermove',
    (e) => {
      if (!lbImg?.classList.contains('is-zoomed')) return;
      lbImg.style.transformOrigin = `${(e.clientX / innerWidth) * 100}% ${(e.clientY / innerHeight) * 100}%`;
    },
    { signal },
  );

  updateStock();
}
