// Suivi de commande (démo) : retrouve une commande passée sur cet appareil et
// estime ses étapes à partir de la date et du mode de livraison.
import { $orders, findOrder, type Order } from '../lib/orders';
import { addBusinessDays, isBusinessDay } from '../lib/delivery';
import { catalog } from '../lib/catalog';
import { validateAll } from './forms';
import { t, price, lang } from './i18n';
import { intlLocale } from '../i18n';

// Jours ouvrés entre l'expédition et la livraison, par mode (min, max)
const DAYS: Record<string, [number, number]> = { relay: [3, 5], home: [2, 3], express: [1, 1] };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const at = (d: Date, h: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h);

/** Étapes estimées d'une commande : confirmée → préparée → expédiée → en livraison → livrée. */
export function timeline(order: Order, now = new Date()) {
  const placed = new Date(order.date);
  const sameDay = placed.getHours() < 14 && isBusinessDay(placed);
  const ship = at(sameDay ? placed : addBusinessDays(placed, 1), 17);
  const [min, max] = DAYS[order.method] ?? DAYS.relay;
  const out = at(addBusinessDays(ship, Math.max(1, min) - (min > 1 ? 1 : 0)), 8);
  const from = at(addBusinessDays(ship, min), 12);
  const to = at(addBusinessDays(ship, max), 19);
  const steps = [
    { key: 'placed', date: placed },
    { key: 'packed', date: new Date(Math.min(ship.getTime() - 3 * 3600e3, Math.max(placed.getTime() + 3600e3, at(ship, 10).getTime()))) },
    { key: 'shipped', date: ship },
    { key: 'out', date: out },
    { key: 'delivered', date: from, until: to },
  ];
  // Livré seulement à la fin de la fenêtre estimée
  const reached = steps.filter((s) => now >= (s.key === 'delivered' ? to : s.date)).length;
  return { steps, current: Math.max(0, reached - 1), done: reached === steps.length };
}

const LABELS = {
  placed: () => [t('Commande confirmée', 'Order confirmed'), t('Paiement accepté, e-mail de confirmation envoyé.', 'Payment accepted, confirmation email sent.')],
  packed: () => [t('En préparation', 'Being packed'), t("On plie, on emballe, on glisse un petit mot à l'atelier.", 'Folded, packed, with a little note from the studio.')],
  shipped: () => [t('Expédiée', 'Shipped'), t('Le colis a quitté l’atelier.', 'Your parcel has left the studio.')],
  out: () => [t('En cours de livraison', 'On its way'), t('Le transporteur l’achemine vers toi.', 'The carrier is bringing it to you.')],
  delivered: () => [t('Livrée', 'Delivered'), t('Bonne première sortie.', 'Enjoy the first wear.')],
} as const;

export function initTrack(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-track]');
  if (!root) return;
  const form = root.querySelector<HTMLFormElement>('[data-track-form]')!;
  const idle = root.querySelector<HTMLElement>('[data-track-idle]')!;
  const none = root.querySelector<HTMLElement>('[data-track-none]')!;
  const card = root.querySelector<HTMLElement>('[data-track-result]')!;
  const methods = JSON.parse(root.querySelector('[data-track-methods]')!.textContent || '{}') as Record<string, string>;
  const fmtDate = new Intl.DateTimeFormat(intlLocale(lang()), { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = new Intl.DateTimeFormat(intlLocale(lang()), { hour: '2-digit', minute: '2-digit' });
  const $ = <T extends HTMLElement>(s: string) => card.querySelector<T>(s)!;
  const field = (n: string) => form.elements.namedItem(n) as HTMLInputElement;

  function show(order: Order | null, focus = true) {
    idle.hidden = true;
    none.hidden = !!order;
    card.hidden = !order;
    root!.querySelectorAll<HTMLButtonElement>('[data-track-pick]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.trackPick === order?.id)));
    if (!order) return;
    const tl = timeline(order);
    const [status] = LABELS[tl.steps[tl.current].key as keyof typeof LABELS]();
    $('[data-track-status]').textContent = tl.done ? t('Livrée', 'Delivered') : status;
    $('[data-track-id]').textContent = order.id;
    $('[data-track-date]').textContent = fmtDate.format(new Date(order.date));
    $('[data-track-method]').textContent = methods[order.method] ?? order.method;
    $('[data-track-total]').textContent = price(order.total);
    $('[data-track-steps]').innerHTML = tl.steps
      .map((s, i) => {
        const [title, desc] = LABELS[s.key as keyof typeof LABELS]();
        const state = i < tl.current || tl.done ? 'is-done' : i === tl.current ? 'is-current' : '';
        const when =
          'until' in s && s.until
            ? i <= tl.current && tl.done
              ? fmtDate.format(s.until)
              : t(`Prévue entre le ${fmtDate.format(s.date)} et le ${fmtDate.format(s.until)}`, `Expected between ${fmtDate.format(s.date)} and ${fmtDate.format(s.until)}`)
            : i <= tl.current
              ? `${fmtDate.format(s.date)} · ${fmtTime.format(s.date)}`
              : t(`Prévu le ${fmtDate.format(s.date)}`, `Expected ${fmtDate.format(s.date)}`);
        return `<li class="${state}"><span class="trk__dot">${state === 'is-done' ? '✓' : i + 1}</span><div><strong>${title}</strong><p class="trk__when">${when}</p>${state ? `<p class="trk__desc">${desc}</p>` : ''}</div></li>`;
      })
      .join('');
    const pct = tl.done ? 100 : Math.round(((tl.current + 0.5) / tl.steps.length) * 100);
    const bar = $('[data-track-bar]');
    bar.style.width = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.width = `${pct}%`)));
    $('[data-track-lines]').innerHTML = order.lines
      .map((l) => {
        const p = catalog().find((x) => x.id === l.id);
        return `<div class="trk__line"><img src="${esc(p?.image ?? l.image)}" alt="" width="48" height="60" loading="lazy"><span><a class="link" href="${esc(p?.url ?? '#')}">${esc(p?.name ?? l.name)}</a><br><span class="muted">${esc(p?.color ?? l.color)} · ${t('Taille', 'Size')} ${esc(l.size)} · ×${l.qty}</span></span><span>${price(l.price * l.qty)}</span></div>`;
      })
      .join('');
    if (focus) card.focus({ preventScroll: false });
  }

  function lookup(focus = true) {
    const order = findOrder(field('order').value, field('email').value);
    show(order, focus);
    if (order) history.replaceState(history.state, '', `?${new URLSearchParams({ commande: order.id, email: order.email })}`);
  }

  form.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      field('order').value = field('order').value.trim().toUpperCase();
      if (!validateAll(form)) return;
      lookup();
    },
    { signal },
  );

  /* Commandes enregistrées sur cet appareil : un clic pour les suivre */
  const mine = root.querySelector<HTMLElement>('[data-track-mine]')!;
  const orders = $orders.get();
  mine.hidden = orders.length === 0;
  mine.querySelector('[data-track-mine-list]')!.innerHTML = orders
    .slice(0, 5)
    .map((o) => `<li><button type="button" data-track-pick="${esc(o.id)}"><b>${esc(o.id)}</b><span class="muted">${fmtDate.format(new Date(o.date))} · ${price(o.total)}</span></button></li>`)
    .join('');
  mine.addEventListener(
    'click',
    (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-track-pick]');
      const o = b && orders.find((x) => x.id === b.dataset.trackPick);
      if (!o) return;
      field('order').value = o.id;
      field('email').value = o.email;
      lookup();
    },
    { signal },
  );

  /* Lien direct depuis la confirmation : ?commande=…&email=… */
  const params = new URLSearchParams(location.search);
  if (params.get('commande')) {
    field('order').value = params.get('commande')!.toUpperCase();
    field('email').value = params.get('email') ?? '';
    if (field('email').value) lookup(false);
  }
}
