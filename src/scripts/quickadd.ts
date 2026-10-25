// Achat instantané : ajout au panier en un clic depuis une carte ou le hero,
// la pastille « vole » jusqu'au panier, puis une notification propose de commander.
import { addItem } from '../lib/cart';
import { formatPrice } from '../lib/shop';
import { reducedMotion } from './scroll';

export interface QuickProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  image: string;
  sizes: { size: string; stock: number }[];
}

let toastTimer = 0;

function flyToCart(from: HTMLElement) {
  const target = document.querySelector<HTMLElement>('.bar__count');
  if (!target || reducedMotion) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'fly';
  dot.style.left = `${a.left + a.width / 2}px`;
  dot.style.top = `${a.top + a.height / 2}px`;
  document.body.append(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  dot
    .animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * 0.35}px), calc(-50% + ${dy * 0.35 - 140}px)) scale(1.4)`, opacity: 1, offset: 0.4 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.5)`, opacity: 0.9 },
      ],
      { duration: 850, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
    )
    .finished.then(() => dot.remove());
}

function toast(p: QuickProduct, size: string) {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.querySelector<HTMLImageElement>('[data-toast-img]')!.src = p.image;
  el.querySelector('[data-toast-name]')!.textContent = p.name;
  el.querySelector('[data-toast-meta]')!.textContent = `${p.color} · ${size} · ${formatPrice(p.price)}`;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('is-visible'), 4500);
}

export function quickAdd(p: QuickProduct, size: string, from: HTMLElement) {
  const s = p.sizes.find((x) => x.size === size);
  if (!s || s.stock === 0) return;
  addItem({ id: p.id, slug: p.slug, name: p.name, price: p.price, color: p.color, size, max: s.stock, image: new URL(p.image, location.href).href });
  from.classList.remove('is-added');
  void from.offsetWidth;
  from.classList.add('is-added');
  flyToCart(from);
  setTimeout(() => toast(p, size), reducedMotion ? 0 : 600);
}

// Cartes produit : délégation sur [data-qa-size]
export function initQuickAdd() {
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-qa-size]');
    if (!btn) return;
    const card = btn.closest<HTMLElement>('[data-qa]');
    if (!card) return;
    e.preventDefault();
    quickAdd(JSON.parse(card.dataset.qa!) as QuickProduct, btn.dataset.qaSize!, btn);
  });
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-toast-close]')) document.querySelector('[data-toast]')?.classList.remove('is-visible');
  });
  document.addEventListener('astro:before-swap', () => document.querySelector('[data-toast]')?.classList.remove('is-visible'));
}
