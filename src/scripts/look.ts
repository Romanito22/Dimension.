// Lookbook : « Acheter le look » — toutes les pièces d'une photo, tailles pré-choisies, en un clic.
import { addItem, openDrawer } from '../lib/cart';
import { $mySize } from '../lib/saved';
import { esc } from './html';
import { t, price } from './i18n';

interface LookItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  image: string;
  url: string;
  sizes: { size: string; stock: number }[];
}
const ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function initLook(signal: AbortSignal) {
  const sheet = document.querySelector<HTMLDialogElement>('[data-look-sheet]');
  if (!sheet) return;
  const list = sheet.querySelector<HTMLElement>('[data-look-list]')!;
  const msg = sheet.querySelector<HTMLElement>('[data-look-msg]')!;
  const addBtn = sheet.querySelector<HTMLButtonElement>('[data-look-add]')!;
  let items: LookItem[] = [];
  const chosen = new Map<string, string>(); // id → taille ('' = pièce non prise)

  function render() {
    list.innerHTML = items
      .map((p) => {
        const sizes = ORDER.map((z) => p.sizes.find((s) => s.size === z)).filter(Boolean) as LookItem['sizes'];
        const pick = chosen.get(p.id);
        return `<li data-id="${esc(p.id)}"><a href="${esc(p.url)}"><img src="${esc(p.image)}" alt="" width="160" height="200"></a><div>
          <p class="ls__top"><a class="link" href="${esc(p.url)}">${esc(p.name)}</a><span>${price(p.price)}</span></p>
          <div class="ls__sizes" role="radiogroup" aria-label="${esc(t(`Taille pour ${p.name}`, `Size for ${p.name}`))}">${sizes
            .map((s) => `<button type="button" role="radio" aria-checked="${pick === s.size}" data-ls-size="${s.size}" data-qa-size="${s.size}" ${s.stock === 0 ? 'disabled' : ''}>${s.size}</button>`)
            .join('')}</div>
          ${items.length > 1 ? `<button type="button" class="link ls__skip" data-ls-skip>${pick === '' ? t('Reprendre cette pièce', 'Include this piece') : t('Je ne prends pas cette pièce', 'Skip this piece')}</button>` : ''}
        </div></li>`;
      })
      .join('');
    const picked = items.filter((p) => chosen.get(p.id));
    const total = picked.reduce((n, p) => n + p.price, 0);
    addBtn.textContent = picked.length
      ? t(`Ajouter ${picked.length > 1 ? `les ${picked.length} pièces` : 'la pièce'} · ${price(total)}`, `Add ${picked.length > 1 ? `${picked.length} pieces` : 'the piece'} · ${price(total)}`)
      : t('Choisis au moins une taille', 'Pick at least one size');
  }

  sheet.addEventListener(
    'dialog:open',
    (e) => {
      const opener = (e as CustomEvent<{ opener: HTMLElement | null }>).detail.opener;
      items = JSON.parse(opener?.dataset.look ?? '[]');
      sheet.querySelector('[data-look-title]')!.textContent = opener?.dataset.lookName ?? 'Look';
      chosen.clear();
      const mine = $mySize.get();
      items.forEach((p) => chosen.set(p.id, p.sizes.some((s) => s.size === mine && s.stock > 0) ? mine : '?'));
      msg.textContent = '';
      render();
    },
    { signal },
  );

  sheet.addEventListener(
    'click',
    (e) => {
      const el = e.target as HTMLElement;
      const li = el.closest<HTMLElement>('li[data-id]');
      const size = el.closest<HTMLElement>('[data-ls-size]');
      if (li && size) {
        chosen.set(li.dataset.id!, size.dataset.lsSize!);
        msg.textContent = '';
        render();
        return;
      }
      if (li && el.closest('[data-ls-skip]')) {
        chosen.set(li.dataset.id!, chosen.get(li.dataset.id!) === '' ? '?' : '');
        render();
        return;
      }
      if (!el.closest('[data-look-add]')) return;
      const missing = items.filter((p) => chosen.get(p.id) === '?');
      const picked = items.filter((p) => chosen.get(p.id) && chosen.get(p.id) !== '?');
      if (missing.length) {
        msg.textContent = t(`Choisis ta taille pour : ${missing.map((p) => p.name).join(', ')}.`, `Pick your size for: ${missing.map((p) => p.name).join(', ')}.`);
        return;
      }
      if (!picked.length) return;
      picked.forEach((p) => {
        const size = chosen.get(p.id)!;
        const s = p.sizes.find((x) => x.size === size)!;
        addItem({ id: p.id, slug: p.slug, name: p.name, price: p.price, color: p.color, size, max: s.stock, image: new URL(p.image, location.href).href });
      });
      sheet.close();
      setTimeout(openDrawer, 200);
    },
    { signal },
  );
}
