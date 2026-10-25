import { $cart, $count, $subtotal, $drawerOpen, setQty, removeItem, openDrawer, closeDrawer, type CartItem } from '../lib/cart';
import { formatPrice } from '../lib/shop';
import brand from '../data/brand.json';
import { lockScroll, unlockScroll } from './scroll';
import { catalog } from '../lib/catalog';
import { addItem } from '../lib/cart';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function renderLines(items: CartItem[], compact = false) {
  if (!items.length) {
    return `<div class="cart-empty">
      <span class="cart-empty__mark" aria-hidden="true"></span>
      <p class="display h-lg">Ton panier est vide</p>
      <p class="muted">Le Drop 01 n'attend que toi — et les séries sont courtes.</p>
      <a href="/boutique" class="btn" data-cart-close>Voir la boutique <span class="btn__dot" aria-hidden="true"></span></a>
    </div>`;
  }
  return `<ul class="lines${compact ? ' lines--compact' : ''}" role="list">${items
    .map(
      (i) => `<li class="line">
      <div class="line__thumb" style="position:relative">
        <a href="/produit/${esc(i.slug)}" class="line__img media ratio-45" tabindex="-1" data-cart-close><img src="${esc(i.image)}" alt="" width="160" height="200" loading="lazy"></a>
        ${compact ? `<span class="line__qtybadge">${i.qty}</span>` : ''}
      </div>
      <div class="line__info">
        <div class="line__top"><a href="/produit/${esc(i.slug)}" data-cart-close>${esc(i.name)}</a><span>${formatPrice(i.price * i.qty)}</span></div>
        <p class="line__opts muted">${esc(i.color)} · Taille ${esc(i.size)}${compact ? '' : ` · ${formatPrice(i.price)}`}</p>
        ${
          compact
            ? ''
            : `<div class="line__bottom">
          <div class="qty" role="group" aria-label="Quantité pour ${esc(i.name)}">
            <button type="button" data-qty="${esc(i.key)}" data-delta="-1" aria-label="Retirer un">−</button>
            <output aria-live="polite">${i.qty}</output>
            <button type="button" data-qty="${esc(i.key)}" data-delta="1" aria-label="Ajouter un" ${i.qty >= i.max ? 'disabled' : ''}>+</button>
          </div>
          <button type="button" class="label line__remove" data-remove="${esc(i.key)}">Retirer</button>
        </div>`
        }
      </div>
    </li>`,
    )
    .join('')}</ul>`;
}

function shippingMessage(subtotal: number) {
  const t = brand.shipping.freeThreshold;
  if (subtotal >= t) return { text: '<strong>Livraison offerte</strong> débloquée. Bien joué.', pct: 100 };
  return {
    text: `Plus que <strong>${formatPrice(t - subtotal)}</strong> pour la livraison offerte.`,
    pct: Math.round((subtotal / t) * 100),
  };
}

function renderUpsell(items: CartItem[]) {
  const box = document.querySelector<HTMLElement>('[data-upsell]');
  if (!box) return;
  const inCart = new Set(items.map((i) => i.id));
  const picks = catalog()
    .filter((p) => !inCart.has(p.id) && p.sizes.some((s) => s.stock > 0))
    .slice(0, 2);
  box.hidden = items.length === 0 || picks.length === 0;
  box.querySelector('[data-upsell-list]')!.innerHTML = picks
    .map((p) => {
      const qa = esc(JSON.stringify({ id: p.id, slug: p.slug, name: p.name, price: p.price, color: p.color, image: p.image, sizes: p.sizes }));
      return `<div class="up" data-qa="${qa}">
        <img src="${esc(p.image)}" alt="" width="128" height="160" loading="lazy">
        <div><div class="up__top"><a href="${esc(p.url)}" data-cart-close>${esc(p.name)}</a><span>${formatPrice(p.price)}</span></div>
        <div class="up__sizes" role="group" aria-label="Ajouter ${esc(p.name)}">${p.sizes
          .map((s) => `<button type="button" data-qa-size="${s.size}" ${s.stock === 0 ? 'disabled' : ''}>${s.size}</button>`)
          .join('')}</div></div>
      </div>`;
    })
    .join('');
}

let lastRemoved: CartItem | null = null;
let undoTimer = 0;
function showUndo(item: CartItem) {
  lastRemoved = item;
  const bar = document.querySelector<HTMLElement>('[data-undo]');
  if (!bar) return;
  bar.querySelector('[data-undo-name]')!.textContent = `${item.name} (${item.size})`;
  bar.hidden = false;
  clearTimeout(undoTimer);
  undoTimer = window.setTimeout(() => (bar.hidden = true), 6000);
}

function render() {
  const items = $cart.get();
  renderUpsell(items);
  const count = $count.get();
  const subtotal = $subtotal.get();

  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
    el.classList.toggle('has-items', count > 0);
  });
  document.querySelectorAll<HTMLElement>('[data-cart-lines]').forEach((el) => {
    el.innerHTML = renderLines(items);
  });
  document.querySelectorAll<HTMLElement>('[data-cart-subtotal]').forEach((el) => {
    el.textContent = formatPrice(subtotal);
  });
  document.querySelectorAll<HTMLElement>('[data-cart-foot]').forEach((el) => {
    el.hidden = items.length === 0;
  });
  const ship = shippingMessage(subtotal);
  document.querySelectorAll<HTMLElement>('[data-ship]').forEach((el) => {
    el.hidden = items.length === 0;
    el.querySelector('[data-ship-text]')!.innerHTML = ship.text;
    (el.querySelector('[data-ship-bar]') as HTMLElement).style.width = `${ship.pct}%`;
  });
}

let lastFocus: HTMLElement | null = null;
function setDrawer(open: boolean) {
  const drawer = document.querySelector<HTMLElement>('[data-drawer]');
  if (!drawer) return;
  const wasOpen = drawer.classList.contains('is-open');
  if (open === wasOpen) return;
  drawer.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  drawer.inert = !open;
  if (open) {
    lastFocus = document.activeElement as HTMLElement;
    lockScroll();
    requestAnimationFrame(() => drawer.querySelector<HTMLElement>('.drawer__panel')?.focus());
  } else {
    unlockScroll();
    lastFocus?.focus?.();
  }
}

export function initCartUI() {
  $cart.subscribe(render);
  $drawerOpen.subscribe(setDrawer);

  let prev = $count.get();
  $count.listen((n) => {
    if (n > prev) {
      document.querySelectorAll('.bar__count').forEach((el) => {
        el.classList.remove('bump');
        void (el as HTMLElement).offsetWidth;
        el.classList.add('bump');
      });
    }
    prev = n;
  });

  const drawer = document.querySelector<HTMLElement>('[data-drawer]');
  if (drawer) drawer.inert = true;

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-cart-open]')) {
      e.preventDefault();
      openDrawer();
      return;
    }
    if (t.closest('[data-cart-close]')) {
      if (!t.closest('a')) e.preventDefault();
      closeDrawer();
      return;
    }
    const q = t.closest<HTMLElement>('[data-qty]');
    if (q) {
      const item = $cart.get().find((i) => i.key === q.dataset.qty);
      if (item) {
        if (item.qty + Number(q.dataset.delta) <= 0) showUndo(item);
        setQty(item.key, item.qty + Number(q.dataset.delta));
      }
      return;
    }
    const r = t.closest<HTMLElement>('[data-remove]');
    if (r) {
      const item = $cart.get().find((i) => i.key === r.dataset.remove);
      if (item) showUndo(item);
      removeItem(r.dataset.remove!);
      return;
    }
    if (t.closest('[data-undo-btn]') && lastRemoved) {
      const { key: _k, qty, ...rest } = lastRemoved;
      addItem(rest, qty);
      lastRemoved = null;
      document.querySelector<HTMLElement>('[data-undo]')!.hidden = true;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $drawerOpen.get()) closeDrawer();
    // Piège de focus simple dans le tiroir
    if (e.key === 'Tab' && $drawerOpen.get()) {
      const panel = document.querySelector<HTMLElement>('.drawer__panel');
      if (!panel) return;
      const f = [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex="0"]')].filter(
        (el) => el.offsetParent !== null,
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  document.addEventListener('astro:before-swap', () => closeDrawer());
  document.addEventListener('astro:page-load', render);
}
