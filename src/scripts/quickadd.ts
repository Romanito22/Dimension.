// Achat instantané : ajout au panier en un clic depuis une carte ou le hero,
// la pastille « vole » jusqu'au panier, puis une notification propose de commander.
import { addItem } from '../lib/cart';
import { price as formatPrice } from './i18n';
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
  // Cible visible : la barre d'onglets sur mobile, sinon le compteur de l'en-tête.
  const target = [...document.querySelectorAll<HTMLElement>('.tabbar [data-cart-open], .bar__count')].find((el) => el.offsetParent !== null);
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
  // Bouton « + » des cartes (tactile) : ouvre une seule carte à la fois.
  document.addEventListener('click', (e) => {
    const toggle = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-qa-toggle]');
    const current = document.querySelector<HTMLElement>('.card.is-qa');
    if (current && (!toggle || !current.contains(toggle)) && !(e.target as HTMLElement).closest('.card.is-qa .card__qa')) {
      current.classList.remove('is-qa');
      current.querySelector('[data-qa-toggle]')?.setAttribute('aria-expanded', 'false');
    }
    if (!toggle) return;
    e.preventDefault();
    const card = toggle.closest<HTMLElement>('.card')!;
    const open = !card.classList.contains('is-qa');
    card.classList.toggle('is-qa', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-qa-size]');
    if (!btn) return;
    const card = btn.closest<HTMLElement>('[data-qa]');
    if (!card) return;
    e.preventDefault();
    quickAdd(JSON.parse(card.dataset.qa!) as QuickProduct, btn.dataset.qaSize!, btn);
    setTimeout(() => card.classList.remove('is-qa'), 700);
  });
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-toast-close]')) document.querySelector('[data-toast]')?.classList.remove('is-visible');
  });
  document.addEventListener('astro:before-swap', () => document.querySelector('[data-toast]')?.classList.remove('is-visible'));
}
