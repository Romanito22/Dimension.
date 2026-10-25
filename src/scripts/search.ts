// Recherche instantanée dans le catalogue : insensible aux accents, navigation au clavier.
import { catalog, norm, stockOf, type CatalogItem } from '../lib/catalog';
import { $recent } from '../lib/saved';
import { formatPrice } from '../lib/shop';
import { lockScroll, unlockScroll } from './scroll';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function highlight(text: string, q: string) {
  if (!q) return esc(text);
  const i = norm(text).indexOf(q);
  if (i < 0) return esc(text);
  return `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`;
}

function item(p: CatalogItem, q: string, i: number) {
  const st = stockOf(p);
  return `<li class="search__item" role="option" id="sr-${i}" aria-selected="false">
    <a href="${p.url}" data-search-close>
      <img src="${p.image}" alt="" width="56" height="70" loading="lazy">
      <span><strong>${highlight(p.name, q)}</strong><span class="search__meta">${esc(p.category)} · ${esc(p.color)} · ${st === 0 ? 'Épuisé' : `${st} en stock`}</span></span>
      <span class="search__price">${formatPrice(p.price)}</span>
    </a>
  </li>`;
}

export function initSearch() {
  const root = document.querySelector<HTMLElement>('[data-search]');
  if (!root) return;
  const input = root.querySelector<HTMLInputElement>('[data-search-input]')!;
  const list = root.querySelector<HTMLElement>('[data-search-results]')!;
  const empty = root.querySelector<HTMLElement>('[data-search-empty]')!;
  const none = root.querySelector<HTMLElement>('[data-search-none]')!;
  const count = root.querySelector<HTMLElement>('[data-search-count]')!;
  const recentBox = root.querySelector<HTMLElement>('[data-search-recent]')!;
  let active = -1;
  let lastFocus: HTMLElement | null = null;

  function run() {
    const q = norm(input.value.trim());
    active = -1;
    input.removeAttribute('aria-activedescendant');
    if (!q) {
      list.innerHTML = '';
      empty.hidden = false;
      none.hidden = true;
      count.hidden = true;
      const recent = $recent
        .get()
        .map((id) => catalog().find((p) => p.id === id))
        .filter(Boolean) as CatalogItem[];
      recentBox.innerHTML = recent.length
        ? `<p class="label">Vus récemment</p><ul class="search__recent" role="list">${recent.slice(0, 4).map((p, i) => item(p, '', 100 + i)).join('')}</ul>`
        : '';
      return;
    }
    const words = q.split(/\s+/);
    const results = catalog().filter((p) => {
      const hay = norm([p.name, p.short, p.category, p.color, p.id, p.badge].join(' '));
      return words.every((w) => hay.includes(w));
    });
    empty.hidden = true;
    none.hidden = results.length > 0;
    count.hidden = results.length === 0;
    count.textContent = `${results.length} résultat${results.length > 1 ? 's' : ''}`;
    root!.querySelector('[data-search-term]')!.textContent = `« ${input.value.trim()} »`;
    list.innerHTML = results.map((p, i) => item(p, q, i)).join('');
  }

  function move(delta: number) {
    const items = [...list.querySelectorAll<HTMLElement>('.search__item')];
    if (!items.length) return;
    active = (active + delta + items.length) % items.length;
    items.forEach((el, i) => el.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', items[active].id);
    items[active].scrollIntoView({ block: 'nearest' });
  }

  function open(prefill = '') {
    if (!root!.hidden) return;
    lastFocus = document.activeElement as HTMLElement;
    root!.hidden = false;
    input.value = prefill;
    run();
    lockScroll();
    requestAnimationFrame(() => input.focus());
  }
  function close() {
    if (root!.hidden) return;
    root!.hidden = true;
    unlockScroll();
    lastFocus?.focus?.();
  }

  input.addEventListener('input', run);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      list.querySelectorAll<HTMLAnchorElement>('.search__item a')[active]?.click();
    }
  });
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const chip = t.closest<HTMLElement>('[data-search-q]');
    if (chip) {
      input.value = chip.dataset.searchQ!;
      run();
      input.focus();
      return;
    }
    if (t.closest('[data-search-close]')) close();
  });

  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-search-open]')) {
      e.preventDefault();
      open();
    }
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const typing = t.closest('input, textarea, select, [contenteditable]');
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      root!.hidden ? open() : close();
    } else if (e.key === '/' && !typing) {
      e.preventDefault();
      open();
    } else if (e.key === 'Escape') close();
  });
  document.addEventListener('astro:before-swap', close);
}
