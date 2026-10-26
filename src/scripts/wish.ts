// Favoris : cœurs sur les cartes et les fiches, compteur de l'en-tête, page /favoris.
import { $wishlist, toggleWish } from '../lib/saved';
import { catalog, stockOf } from '../lib/catalog';
import { t, price as formatPrice } from './i18n';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function sync() {
  const list = $wishlist.get();
  document.querySelectorAll<HTMLElement>('[data-wish]').forEach((b) => {
    const on = list.includes(b.dataset.wish!);
    b.setAttribute('aria-pressed', String(on));
    const label = b.querySelector('[data-wish-label]');
    if (label) label.textContent = on ? t('Dans tes favoris', 'In your wishlist') : t('Ajouter aux favoris', 'Add to wishlist');
    b.setAttribute('aria-label', on ? t('Retirer des favoris', 'Remove from wishlist') : t('Ajouter aux favoris', 'Add to wishlist'));
  });
  document.querySelectorAll<HTMLElement>('[data-wish-count]').forEach((el) => {
    el.textContent = String(list.length);
    el.hidden = list.length === 0;
  });
  renderPage();
}

function renderPage() {
  const root = document.querySelector<HTMLElement>('[data-wish-page]');
  if (!root) return;
  const items = $wishlist
    .get()
    .map((id) => catalog().find((p) => p.id === id))
    .filter(Boolean) as ReturnType<typeof catalog>;
  root.querySelector<HTMLElement>('[data-wish-empty]')!.hidden = items.length > 0;
  const n = items.length;
  root.querySelector<HTMLElement>('[data-wish-total]')!.textContent = t(`${n} pièce${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''}`, `${n} piece${n > 1 ? 's' : ''} saved`);
  root.querySelector<HTMLElement>('[data-wish-grid]')!.innerHTML = items
    .map((p) => {
      const qa = esc(JSON.stringify({ id: p.id, slug: p.slug, name: p.name, price: p.price, color: p.color, image: p.image, sizes: p.sizes }));
      const st = stockOf(p);
      return `<article class="wcard" data-qa="${qa}">
        <a href="${p.url}" class="wcard__media"><img src="${p.image}" alt="${esc(p.name)}" width="800" height="1000" loading="lazy"></a>
        <button type="button" class="wish-btn wcard__wish" data-wish="${p.id}" aria-pressed="true" aria-label="${t('Retirer des favoris', 'Remove from wishlist')}">${HEART}</button>
        <div class="wcard__meta"><a href="${p.url}"><strong>${esc(p.name)}</strong></a><span class="wcard__price">${formatPrice(p.price)}</span></div>
        <p class="label wcard__stock">${st === 0 ? t('Épuisé', 'Sold out') : st <= 15 ? t(`Plus que ${st}`, `Only ${st} left`) : t(`${st} en stock`, `${st} in stock`)}</p>
        <div class="wcard__sizes" role="group" aria-label="${t(`Ajouter ${esc(p.name)} au panier`, `Add ${esc(p.name)} to bag`)}">
          ${p.sizes.map((s) => `<button type="button" data-qa-size="${s.size}" ${s.stock === 0 ? 'disabled' : ''}>${s.size}</button>`).join('')}
        </div>
      </article>`;
    })
    .join('');
}

export const HEART =
  '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S3 15 3 8.8C3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 6.2-9 11.7-9 11.7z"/></svg>';

export function initWish() {
  $wishlist.subscribe(sync);
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-wish]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const on = toggleWish(b.dataset.wish!);
    b.classList.remove('is-pop');
    void b.offsetWidth;
    if (on) b.classList.add('is-pop');
  });
  document.addEventListener('astro:page-load', sync);
}
