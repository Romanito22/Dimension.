import { $cart, $count, $subtotal, $drawerOpen, setQty, removeItem, openDrawer, closeDrawer, type CartItem } from '../lib/cart';
import brand from '../data/brand.json';
import { t, price as formatPrice, link } from './i18n';
import { openDialog } from './dialogs';
import { catalog } from '../lib/catalog';
import { addItem } from '../lib/cart';
import { esc } from './html';


/** Nom et couleur dans la langue de la page (le panier garde ceux du moment de l'ajout). */
function display(i: CartItem) {
  const p = catalog().find((x) => x.id === i.id);
  return { name: p?.name ?? i.name, color: p?.color ?? i.color, url: p?.url ?? link('product', i.slug) };
}

export function renderLines(items: CartItem[], compact = false) {
  if (!items.length) {
    return `<div class="empty-state empty-state--center">
      <span class="empty-state__mark" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg></span>
      <p class="display h-lg">${t('Ton panier est vide', 'Your bag is empty')}</p>
      <p class="muted">${t("Le Drop 01 n'attend que toi — et les séries sont courtes.", 'Drop 01 is waiting for you — and the runs are short.')}</p>
      <a href="${link('shop')}" class="btn" data-cart-close>${t('Voir la boutique', 'Visit the shop')} <span class="btn__dot" aria-hidden="true"></span></a>
    </div>`;
  }
  return `<ul class="lines${compact ? ' lines--compact' : ''}" role="list">${items
    .map((i) => {
      const d = display(i);
      return `<li class="line">
      <div class="line__thumb" style="position:relative">
        <a href="${esc(d.url)}" class="line__img media ratio-45" tabindex="-1" data-cart-close><img src="${esc(i.image)}" alt="" width="160" height="200" loading="lazy"></a>
        ${compact ? `<span class="line__qtybadge">${i.qty}</span>` : ''}
      </div>
      <div class="line__info">
        <div class="line__top"><a href="${esc(d.url)}" data-cart-close>${esc(d.name)}</a><span>${formatPrice(i.price * i.qty)}</span></div>
        <p class="line__opts muted">${esc(d.color)} · ${t('Taille', 'Size')} ${esc(i.size)}${compact ? '' : ` · ${formatPrice(i.price)}`}</p>
        ${
          compact
            ? ''
            : `<div class="line__bottom">
          <div class="qty" role="group" aria-label="${t('Quantité pour', 'Quantity for')} ${esc(d.name)}">
            <button type="button" data-qty="${esc(i.key)}" data-delta="-1" aria-label="${t('Retirer un', 'Remove one')}">−</button>
            <output aria-live="polite">${i.qty}</output>
            <button type="button" data-qty="${esc(i.key)}" data-delta="1" aria-label="${t('Ajouter un', 'Add one')}" ${i.qty >= i.max ? 'disabled' : ''}>+</button>
          </div>
          <button type="button" class="label line__remove" data-remove="${esc(i.key)}">${t('Retirer', 'Remove')}</button>
        </div>`
        }
      </div>
    </li>`;
    })
    .join('')}</ul>`;
}

function shippingMessage(subtotal: number) {
  const th = brand.shipping.freeThreshold;
  if (subtotal >= th) return { text: t('<strong>Livraison offerte</strong> débloquée. Bien joué.', '<strong>Free delivery</strong> unlocked. Nice one.'), pct: 100 };
  return {
    text: t(`Plus que <strong>${formatPrice(th - subtotal)}</strong> pour la livraison offerte.`, `Just <strong>${formatPrice(th - subtotal)}</strong> more for free delivery.`),
    pct: Math.round((subtotal / th) * 100),
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
        <div class="up__sizes" role="group" aria-label="${t('Ajouter', 'Add')} ${esc(p.name)}">${p.sizes
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
  bar.querySelector('[data-undo-name]')!.textContent = `${display(item).name} (${item.size})`;
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

// Le panier est une fenêtre du site (dialogs.ts) ; la boutique pilote son ouverture via $drawerOpen.
function setDrawer(open: boolean) {
  const drawer = document.querySelector<HTMLDialogElement>('dialog[data-drawer]');
  if (!drawer) return;
  if (open) openDialog(drawer);
  else if (drawer.open) drawer.close();
}

export function initCartUI() {
  $cart.subscribe(render);
  $drawerOpen.subscribe(setDrawer);

  let prev = $count.get();
  $count.listen((n) => {
    if (n > prev) {
      document.querySelectorAll('.bar__count, .tabbar__badge--cart').forEach((el) => {
        el.classList.remove('bump');
        void (el as HTMLElement).offsetWidth;
        el.classList.add('bump');
      });
    }
    prev = n;
  });

  // Fermé par Échap, le fond ou un lien : on remet l'état à jour.
  document.addEventListener(
    'close',
    (e) => {
      if ((e.target as HTMLElement).matches?.('dialog[data-drawer]') && $drawerOpen.get()) closeDrawer();
    },
    true,
  );

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

  document.addEventListener('astro:before-swap', () => closeDrawer());
  document.addEventListener('astro:page-load', render);
}
