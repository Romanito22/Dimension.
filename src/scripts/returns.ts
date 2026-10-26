// Retour ou échange en libre-service, depuis la page de suivi (démo) :
// on choisit les pièces, échange de taille ou remboursement, une raison — c'est enregistré.
import brand from '../data/brand.json';
import { saveOrder, type Order } from '../lib/orders';
import { catalog } from '../lib/catalog';
import { t, lang } from './i18n';
import { intlLocale } from '../i18n';
import { esc } from './html';

const REASONS = () => [
  ['big', t('Trop grand', 'Too big')],
  ['small', t('Trop petit', 'Too small')],
  ['style', t('Ne me va pas comme je pensais', 'Not quite what I expected')],
  ['defect', t('Défaut ou erreur de commande', 'Faulty or wrong item')],
  ['other', t('Autre raison', 'Another reason')],
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
/** Tailles d'échange, les plus proches d'abord (M → L, S, XL…). */
const nearest = (from: string) => (a: string, b: string) =>
  Math.abs(SIZES.indexOf(a) - SIZES.indexOf(from)) - Math.abs(SIZES.indexOf(b) - SIZES.indexOf(from)) || SIZES.indexOf(b) - SIZES.indexOf(a);

function actionText(action: string) {
  return action.startsWith('exchange:') ? t(`Échange en ${action.slice(9)}`, `Exchange for ${action.slice(9)}`) : t('Remboursement', 'Refund');
}

export function initReturns(box: HTMLElement, signal: AbortSignal) {
  let order: Order | null = null;
  const fmt = new Intl.DateTimeFormat(intlLocale(lang()), { day: 'numeric', month: 'long' });

  function render(o: Order, deadline: Date, open = false) {
    order = o;
    box.hidden = false;
    const lines = o.lines.map((l, i) => {
      const p = catalog().find((x) => x.id === l.id);
      return { i, l, name: p?.name ?? l.name, color: p?.color ?? l.color, image: p?.image ?? l.image, other: (p?.sizes ?? []).filter((s) => s.stock > 0 && s.size !== l.size).map((s) => s.size).sort(nearest(l.size)) };
    });

    if (o.return) {
      const r = o.return;
      const exchange = r.items.some((it) => it.action.startsWith('exchange:'));
      const refund = r.items.some((it) => !it.action.startsWith('exchange:'));
      box.innerHTML = `<div class="ret__done">
        <p class="label accent">${t('Retour enregistré', 'Return registered')}</p>
        <p class="ret__id"><b>${esc(r.id)}</b> <span class="muted">· ${fmt.format(new Date(r.date))}</span></p>
        <ul class="ret__sum" role="list">${r.items
          .map((it) => {
            const x = lines[Number(it.key)];
            return x ? `<li><img src="${esc(x.image)}" alt="" width="40" height="50" loading="lazy"><span>${esc(x.name)} · ${esc(x.l.size)}</span><strong>${actionText(it.action)}</strong></li>` : '';
          })
          .join('')}</ul>
        <ol class="ret__next">
          <li>${t('Tu reçois l’étiquette retour par e-mail.', 'You get the return label by email.')}</li>
          <li>${t(`Dépose le colis en point relais avant le ${fmt.format(deadline)}.`, `Drop the parcel at a pickup point before ${fmt.format(deadline)}.`)}</li>
          ${exchange ? `<li>${t('Ta nouvelle taille part dès réception — l’échange est gratuit.', 'Your new size ships as soon as we receive it — exchanges are free.')}</li>` : ''}
          ${refund ? `<li>${t('Remboursement dès que ton retour est vérifié, sous 14 jours maximum, sur ton moyen de paiement.', 'Refund as soon as your return is checked, within 14 days at most, to your payment method.')}</li>` : ''}
        </ol>
        <button type="button" class="link link--under label" data-ret-cancel>${t('Annuler la demande', 'Cancel the request')}</button>
      </div>`;
      return;
    }

    if (Date.now() > deadline.getTime()) {
      box.innerHTML = `<p class="muted ret__closed">${t(
        `Le délai de retour de ${brand.shipping.returnsDays} jours est passé. Un souci avec une pièce ? Écris-nous, on trouve une solution.`,
        `The ${brand.shipping.returnsDays}-day return window has closed. A problem with a piece? Write to us and we'll sort it out.`,
      )}</p>`;
      return;
    }

    box.innerHTML = `<details class="ret__box" ${open ? 'open' : ''}>
      <summary><span><strong>${t('Retourner ou échanger', 'Return or exchange')}</strong><span class="muted"> · ${t(`jusqu’au ${fmt.format(deadline)}`, `until ${fmt.format(deadline)}`)}</span></span></summary>
      <form class="ret__form" data-ret-form novalidate>
        <fieldset>
          <legend class="label">${t('Quelles pièces ?', 'Which pieces?')}</legend>
          <ul class="ret__lines" role="list">${lines
            .map(
              (x) => `<li class="ret__line">
              <label class="ret__pick"><input type="checkbox" name="pick" value="${x.i}"><img src="${esc(x.image)}" alt="" width="40" height="50" loading="lazy"><span>${esc(x.name)}<br><span class="muted">${esc(x.color)} · ${t('Taille', 'Size')} ${esc(x.l.size)}</span></span></label>
              <select class="select ret__action" name="action-${x.i}" aria-label="${t('Que veux-tu faire ?', 'What would you like?')} — ${esc(x.name)}" hidden>
                ${x.other.map((s) => `<option value="exchange:${s}">${actionText(`exchange:${s}`)}</option>`).join('')}
                <option value="refund">${actionText('refund')}</option>
              </select>
            </li>`,
            )
            .join('')}</ul>
        </fieldset>
        <label class="ret__reason"><span class="label">${t('La raison', 'The reason')}</span>
          <select class="select" name="reason">${REASONS()
            .map(([v, l]) => `<option value="${v}">${l}</option>`)
            .join('')}</select>
        </label>
        <p class="ret__err" data-ret-err role="alert"></p>
        <button class="btn btn--accent btn--block" type="submit">${t('Valider ma demande', 'Confirm my request')} <span class="btn__dot" aria-hidden="true"></span></button>
        <p class="ret__note muted">${t(
          'Pièces non portées, non lavées, avec leurs étiquettes. L’échange de taille est gratuit (dans la limite des stocks).',
          'Unworn, unwashed pieces with their tags. Size exchanges are free (subject to stock).',
        )}</p>
      </form>
    </details>`;
    if (open) requestAnimationFrame(() => box.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }

  box.addEventListener(
    'change',
    (e) => {
      const input = e.target as HTMLInputElement;
      if (input.name !== 'pick') return;
      input.closest('.ret__line')!.querySelector<HTMLSelectElement>('select')!.hidden = !input.checked;
      box.querySelector('[data-ret-err]')!.textContent = '';
    },
    { signal },
  );

  box.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      if (!order) return;
      const picks = [...form.querySelectorAll<HTMLInputElement>('input[name="pick"]:checked')];
      if (!picks.length) {
        form.querySelector('[data-ret-err]')!.textContent = t('Coche au moins une pièce.', 'Tick at least one piece.');
        return;
      }
      const items = picks.map((p) => ({ key: p.value, action: (form.elements.namedItem(`action-${p.value}`) as HTMLSelectElement).value }));
      const id = `R-${order.id.replace(/^DIM-/, '')}`;
      saveOrder({ ...order, return: { id, date: new Date().toISOString(), items, reason: (form.elements.namedItem('reason') as HTMLSelectElement).value } });
      box.dispatchEvent(new CustomEvent('return:change', { bubbles: true }));
    },
    { signal },
  );

  box.addEventListener(
    'click',
    (e) => {
      if (!order || !(e.target as HTMLElement).closest('[data-ret-cancel]')) return;
      const { return: _r, ...rest } = order;
      saveOrder(rest);
      box.dispatchEvent(new CustomEvent('return:change', { bubbles: true }));
    },
    { signal },
  );

  return render;
}
