// « Mon espace » : affiche et modifie ce que le site garde sur l'appareil.
import { $mySize, $wishlist, $recent, $alerts, $email, forgetEverything } from '../lib/saved';
import { $orders } from '../lib/orders';
import { catalog } from '../lib/catalog';
import { recommendSize } from './product-extras';
import { orderStatus } from './track';
import { esc } from './html';
import { t, price, link, lang } from './i18n';
import { intlLocale } from '../i18n';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initAccount(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-account]');
  if (!root) return;
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const dateFmt = new Intl.DateTimeFormat(intlLocale(lang()), { day: 'numeric', month: 'short' });
  const byId = (id: string) => catalog().find((p) => p.id === id);
  const thumb = (id: string) => {
    const p = byId(id);
    return p ? `<a href="${esc(p.url)}" title="${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="160" height="200" loading="lazy"></a>` : '';
  };

  function render() {
    // Taille
    $('[data-acct-size]').textContent = $mySize.get() || '—';
    // Commandes
    const orders = $orders.get();
    $('[data-acct-orders-empty]').hidden = orders.length > 0;
    $('[data-acct-orders]').innerHTML = orders
      .slice(0, 5)
      .map(
        (o) =>
          `<li><span><span class="acard__id">${esc(o.id)}</span> · ${dateFmt.format(new Date(o.date))}<span class="acard__state">${esc(orderStatus(o))}</span></span><a class="link link--under label" href="${link('track')}?${new URLSearchParams({ commande: o.id, email: o.email })}">${t('Suivre', 'Track')} · ${price(o.total)}</a></li>`,
      )
      .join('');
    // Favoris et vus récemment
    const wish = $wishlist.get();
    $('[data-acct-wish-count]').textContent = wish.length ? `(${wish.length})` : '';
    $('[data-acct-wish]').innerHTML = wish.slice(0, 4).map(thumb).join('');
    $('[data-acct-wish-empty]').hidden = wish.length > 0;
    const recent = $recent.get();
    $('[data-acct-recent]').innerHTML = recent.slice(0, 4).map(thumb).join('');
    $('[data-acct-recent-empty]').hidden = recent.length > 0;
    // Alertes
    const alerts = $alerts.get();
    $('[data-acct-alerts-empty]').hidden = alerts.length > 0;
    $('[data-acct-alerts]').innerHTML = alerts
      .map((a, i) => {
        const p = byId(a.id);
        return `<li><span>${esc(p?.name ?? a.id)} · ${t('Taille', 'Size')} ${esc(a.size)}</span><button type="button" data-acct-alert-del="${i}" aria-label="${t('Supprimer cette alerte', 'Remove this alert')}">×</button></li>`;
      })
      .join('');
    // E-mail
    const input = $<HTMLInputElement>('#acct-email');
    if (document.activeElement !== input) input.value = $email.get();
  }

  const unsubs = [$mySize, $wishlist, $recent, $alerts, $email, $orders].map((s) => s.listen(render));
  signal.addEventListener('abort', () => unsubs.forEach((u) => u()));
  render();

  // Calcul de taille (mêmes règles que le guide des tailles de la fiche produit)
  $<HTMLFormElement>('[data-acct-finder]').addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      const f = e.currentTarget as HTMLFormElement;
      const h = Number((f.elements.namedItem('height') as HTMLInputElement).value);
      const w = Number((f.elements.namedItem('weight') as HTMLInputElement).value);
      const fit = Number((f.querySelector('input[name="fit"]:checked') as HTMLInputElement)?.value ?? 0);
      const note = $('[data-acct-size-note]');
      if (!(h >= 140 && h <= 215) || !(w >= 35 && w <= 160)) {
        note.textContent = t('Indique une taille entre 140 et 215 cm et un poids entre 35 et 160 kg.', 'Enter a height between 140 and 215 cm and a weight between 35 and 160 kg.');
        return;
      }
      $mySize.set(recommendSize(h, w, fit));
      note.textContent = t('Enregistrée : elle est maintenant mise en avant sur toutes les pièces.', 'Saved: it is now highlighted on every piece.');
    },
    { signal },
  );

  $<HTMLFormElement>('[data-acct-email]').addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      const v = $<HTMLInputElement>('#acct-email').value.trim();
      const msg = $('[data-acct-email-msg]');
      if (v && !EMAIL.test(v)) {
        msg.textContent = t('Adresse e-mail invalide.', 'Invalid email address.');
        return;
      }
      $email.set(v);
      msg.textContent = v ? t('E-mail enregistré.', 'Email saved.') : t('E-mail oublié.', 'Email forgotten.');
    },
    { signal },
  );

  root.addEventListener(
    'click',
    (e) => {
      const el = e.target as HTMLElement;
      const del = el.closest<HTMLElement>('[data-acct-alert-del]');
      if (del) {
        const i = Number(del.dataset.acctAlertDel);
        $alerts.set($alerts.get().filter((_, j) => j !== i));
        return;
      }
      if (el.closest('[data-acct-forget]')) {
        const ok = window.confirm(
          t(
            'Effacer ta taille, ton e-mail, tes favoris, ton panier, tes commandes et tes alertes de cet appareil ?',
            'Erase your size, email, wishlist, bag, orders and alerts from this device?',
          ),
        );
        if (!ok) return;
        forgetEverything();
        location.reload();
      }
    },
    { signal },
  );
}
