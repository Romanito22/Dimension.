// Centre d'aide : recherche dans la FAQ (sans accents ni majuscules) et rappel
// de la dernière commande passée sur cet appareil.
import { $orders } from '../lib/orders';
import { orderStatus } from './track';
import { t, price, link } from './i18n';
import { esc } from './html';

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function initHelp() {
  const dialog = document.querySelector<HTMLDialogElement>('dialog[data-dialog="help"]');
  if (!dialog) return;
  const input = dialog.querySelector<HTMLInputElement>('[data-help-input]')!;
  const items = [...dialog.querySelectorAll<HTMLDetailsElement>('[data-help-item]')];
  const groups = [...dialog.querySelectorAll<HTMLElement>('[data-help-group]')];
  const none = dialog.querySelector<HTMLElement>('[data-help-none]')!;
  const orderBox = dialog.querySelector<HTMLElement>('[data-help-order]')!;
  const texts = items.map((d) => norm(d.textContent ?? ''));

  function filter() {
    const words = norm(input.value).split(/\s+/).filter((w) => w.length > 1);
    let shown = 0;
    items.forEach((d, i) => {
      const ok = words.every((w) => texts[i].includes(w));
      d.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach((g) => (g.hidden = !g.querySelector('[data-help-item]:not([hidden])')));
    // Une ou deux réponses : on les déplie directement.
    if (words.length && shown <= 2) items.forEach((d) => (d.open = !d.hidden));
    if (!words.length) items.forEach((d) => (d.open = false));
    none.hidden = shown > 0;
  }

  function renderOrder() {
    const o = $orders.get()[0];
    orderBox.hidden = !o;
    if (!o) return;
    const qs = new URLSearchParams({ commande: o.id, email: o.email });
    orderBox.innerHTML = `<p class="label">${t('Ta dernière commande', 'Your latest order')}</p>
      <p class="help__order-top"><b>${esc(o.id)}</b><span>${esc(orderStatus(o))} · ${price(o.total)}</span></p>
      <p class="help__order-acts">
        <a class="link link--under label" href="${link('track')}?${qs}">${t('Suivre le colis', 'Track the parcel')}</a>
        <a class="link link--under label" href="${link('track')}?${qs}&retour=1">${o.return ? t('Voir mon retour', 'See my return') : t('Retourner / échanger', 'Return / exchange')}</a>
      </p>`;
  }

  input.addEventListener('input', filter);
  dialog.addEventListener('click', (e) => {
    const q = (e.target as HTMLElement).closest<HTMLElement>('[data-help-q]');
    if (!q) return;
    input.value = q.dataset.helpQ!;
    filter();
    input.focus();
  });
  // Les liens du panneau mènent à une autre page : on referme d'abord.
  dialog.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a[href]:not([target])')) dialog.close();
  });
  dialog.addEventListener('dialog:open', (e) => {
    const from = (e as CustomEvent<{ opener: HTMLElement | null }>).detail.opener;
    input.value = from?.dataset.helpTopic ?? '';
    filter();
    renderOrder();
  });
}
