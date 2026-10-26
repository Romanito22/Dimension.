// Tunnel de commande en une page : coordonnées → livraison → paiement.
// Paiement simulé (mode démo) — voir README pour brancher Stripe Checkout.
import { $cart, $subtotal, clearCart } from '../lib/cart';
import { getBrand } from '../lib/shop';
import { saveOrder } from '../lib/orders';
import { t as tr, price as formatPrice, lang, link } from './i18n';
import { renderLines } from './cart-ui';
import { validateAll, validateField } from './forms';
import { lenis } from './scroll';

export function initCheckout(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-checkout]');
  if (!root) return;
  const brand = getBrand(lang());
  const form = root.querySelector<HTMLFormElement>('[data-checkout-form]')!;
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const emptyState = root.querySelector<HTMLElement>('[data-checkout-empty]')!;
  const layout = root.querySelector<HTMLElement>('[data-checkout-layout]')!;
  const confirm = root.querySelector<HTMLElement>('[data-confirm]')!;
  const summary = root.querySelector<HTMLElement>('[data-summary-lines]')!;
  const promoInput = root.querySelector<HTMLInputElement>('[data-promo-input]')!;
  const promoMsg = root.querySelector<HTMLElement>('[data-promo-msg]')!;
  let discountRate = 0;

  const scrollTo = (el: HTMLElement) => {
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    lenis ? lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: 'smooth' });
  };

  function method() {
    const id = form.querySelector<HTMLInputElement>('input[name="shipping"]:checked')?.value ?? 'relay';
    return brand.shipping.methods.find((m) => m.id === id)!;
  }

  function totals() {
    const sub = $subtotal.get();
    const discount = Math.round(sub * discountRate * 100) / 100;
    const m = method();
    const free = sub - discount >= brand.shipping.freeThreshold && m.id !== 'express';
    const ship = free ? 0 : m.price;
    return { sub, discount, ship, total: Math.max(0, sub - discount + ship) };
  }

  function render() {
    const items = $cart.get();
    const done = !confirm.hidden;
    if (done) return;
    emptyState.hidden = items.length > 0;
    layout.hidden = items.length === 0;
    summary.innerHTML = renderLines(items, true);
    const t = totals();
    const set = (k: string, v: string) => root!.querySelectorAll<HTMLElement>(`[data-total="${k}"]`).forEach((el) => (el.textContent = v));
    set('sub', formatPrice(t.sub));
    set('ship', t.ship === 0 ? tr('Offerte', 'Free') : formatPrice(t.ship));
    set('discount', `−${formatPrice(t.discount)}`);
    set('total', formatPrice(t.total));
    root!.querySelectorAll<HTMLElement>('[data-discount-row]').forEach((el) => (el.hidden = t.discount === 0));
    // Met à jour les prix affichés des modes de livraison
    form.querySelectorAll<HTMLElement>('[data-ship-price]').forEach((el) => {
      const m = brand.shipping.methods.find((x) => x.id === el.dataset.shipPrice)!;
      const free = t.sub - t.discount >= brand.shipping.freeThreshold && m.id !== 'express';
      el.textContent = free ? tr('Offerte', 'Free') : formatPrice(m.price);
    });
  }

  const unsub = $cart.subscribe(render);
  signal.addEventListener('abort', unsub);

  /* Étapes */
  function openStep(i: number, focus = true) {
    steps.forEach((s, j) => {
      s.classList.toggle('is-open', j === i);
      s.classList.toggle('is-done', j < i);
      s.querySelector<HTMLElement>('[data-step-body]')!.hidden = j !== i;
      const edit = s.querySelector<HTMLElement>('[data-step-edit]');
      if (edit) edit.hidden = !(j < i);
    });
    const step = steps[i];
    if (!focus) return;
    requestAnimationFrame(() => {
      scrollTo(step);
      step.querySelector<HTMLElement>('input, select')?.focus({ preventScroll: true });
    });
  }

  function summarize(i: number) {
    const s = steps[i];
    const out = s.querySelector<HTMLElement>('[data-step-summary]');
    if (!out) return;
    const v = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? '';
    if (i === 0) out.textContent = `${v('firstname')} ${v('lastname')} · ${v('email')}`;
    if (i === 1) out.textContent = `${v('address')}, ${v('zip')} ${v('city')} · ${method().label}`;
  }

  root.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement;
      const next = t.closest<HTMLElement>('[data-step-next]');
      if (next) {
        const i = steps.indexOf(next.closest('[data-step]') as HTMLElement);
        if (!validateAll(steps[i])) return;
        summarize(i);
        openStep(i + 1);
        return;
      }
      const edit = t.closest<HTMLElement>('[data-step-edit]');
      if (edit) openStep(steps.indexOf(edit.closest('[data-step]') as HTMLElement));
      if (t.closest('[data-promo-apply]')) applyPromo();
    },
    { signal },
  );

  function applyPromo() {
    const code = promoInput.value.trim().toUpperCase();
    if (!code) return;
    if (code === brand.promo.code) {
      discountRate = brand.promo.rate;
      promoMsg.textContent = tr(`Code ${code} appliqué : −${Math.round(brand.promo.rate * 100)} %.`, `Code ${code} applied: ${Math.round(brand.promo.rate * 100)}% off.`);
      promoMsg.classList.remove('is-error');
    } else {
      discountRate = 0;
      promoMsg.textContent = tr('Ce code n’est pas valide.', 'This code is not valid.');
      promoMsg.classList.add('is-error');
    }
    render();
  }
  promoInput.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyPromo();
      }
    },
    { signal },
  );

  form.addEventListener('change', (e) => (e.target as HTMLInputElement).name === 'shipping' && render(), { signal });
  form.addEventListener(
    'blur',
    (e) => {
      const t = e.target as HTMLInputElement;
      if (t.matches('input, select') && t.getAttribute('aria-invalid')) validateField(t);
    },
    { capture: true, signal },
  );

  // Masques de saisie carte
  const card = form.querySelector<HTMLInputElement>('[name="card"]');
  card?.addEventListener(
    'input',
    () => {
      card.value = card.value
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(.{4})/g, '$1 ')
        .trim();
    },
    { signal },
  );
  const exp = form.querySelector<HTMLInputElement>('[name="exp"]');
  exp?.addEventListener(
    'input',
    () => {
      const d = exp.value.replace(/\D/g, '').slice(0, 4);
      exp.value = d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
    },
    { signal },
  );

  form.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      for (let i = 0; i < steps.length; i++) {
        if (!validateAll(steps[i])) {
          openStep(i);
          return;
        }
      }
      const btn = form.querySelector<HTMLButtonElement>('[data-pay]')!;
      btn.disabled = true;
      btn.querySelector('[data-pay-label]')!.textContent = tr('Paiement en cours…', 'Processing payment…');
      const t = totals();
      setTimeout(() => {
        const order = `DIM-${Date.now().toString(36).toUpperCase().slice(-6)}`;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        confirm.querySelector('[data-order-id]')!.textContent = order;
        confirm.querySelector('[data-order-email]')!.textContent = email;
        confirm.querySelector('[data-order-total]')!.textContent = formatPrice(t.total);
        confirm.querySelector('[data-order-lines]')!.innerHTML = renderLines($cart.get(), true);
        // Enregistrée sur l'appareil pour la page de suivi (démo)
        saveOrder({
          id: order,
          email,
          date: new Date().toISOString(),
          method: method().id,
          total: t.total,
          lines: $cart.get().map((i) => ({ id: i.id, slug: i.slug, name: i.name, size: i.size, color: i.color, qty: i.qty, price: i.price, image: i.image })),
        });
        const track = confirm.querySelector<HTMLAnchorElement>('[data-track-link]');
        if (track) track.href = `${link('track')}?${new URLSearchParams({ commande: order, email })}`;
        layout.hidden = true;
        confirm.hidden = false;
        clearCart();
        window.scrollTo({ top: 0 });
        lenis?.scrollTo(0, { immediate: true });
        confirm.focus();
      }, 1200);
    },
    { signal },
  );

  openStep(0, false);
  render();
}
