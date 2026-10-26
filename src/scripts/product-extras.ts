// Fiche produit : livraison estimée, partage, pièces vues récemment,
// assistant de taille et alerte de réassort.
import { deliveryWindow } from '../lib/delivery';
import { $recent, $mySize, pushRecent } from '../lib/saved';
import { catalog } from '../lib/catalog';
import { t, price, lang } from './i18n';
import { esc } from './html';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Recommandation simple à partir de la taille, du poids et de la coupe voulue. */
export function recommendSize(height: number, weight: number, fit: number) {
  const score = weight + (height - 175) * 0.45;
  const base = score < 56 ? 0 : score < 64 ? 1 : score < 73 ? 2 : score < 83 ? 3 : score < 94 ? 4 : 5;
  return SIZES[Math.min(5, Math.max(0, base + fit))];
}

function selectSize(root: HTMLElement, size: string) {
  const input = root.querySelector<HTMLInputElement>(`input[name="size"][value="${size}"]`);
  if (!input || input.disabled) return false;
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

export function initProductExtras(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-product]');
  if (!root) return;
  const data = JSON.parse(root.querySelector('[data-product-json]')!.textContent!) as { id: string; name: string };

  /* Livraison estimée */
  const eta = root.querySelector<HTMLElement>('[data-eta-text]');
  if (eta) {
    const w = deliveryWindow(3, 5, new Date(), lang());
    eta.innerHTML = t(
      `${w.cutoff ? 'Commande avant 14 h, ' : 'Commande maintenant, '}reçue entre le <strong>${w.from}</strong> et le <strong>${w.to}</strong>`,
      `${w.cutoff ? 'Order before 2 pm, ' : 'Order now, '}delivered between <strong>${w.from}</strong> and <strong>${w.to}</strong>`,
    );
  }

  /* Partage */
  const shareMsg = root.querySelector<HTMLElement>('[data-share-msg]');
  root.querySelector('[data-share]')?.addEventListener(
    'click',
    async () => {
      const url = location.href;
      try {
        if (navigator.share) {
          await navigator.share({ title: `${data.name} — dimension.`, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        if (shareMsg) shareMsg.textContent = t('Lien copié — envoie-le à qui tu veux.', 'Link copied — send it to anyone.');
      } catch {
        if (shareMsg) shareMsg.textContent = t(`Copie ce lien : ${url}`, `Copy this link: ${url}`);
      }
      setTimeout(() => shareMsg && (shareMsg.textContent = ''), 4000);
    },
    { signal },
  );

  /* Vus récemment (on affiche l'historique avant d'y ajouter la pièce courante) */
  const recentBox = document.querySelector<HTMLElement>('[data-recent]');
  const recentItems = $recent
    .get()
    .filter((id) => id !== data.id)
    .map((id) => catalog().find((p) => p.id === id))
    .filter(Boolean) as ReturnType<typeof catalog>;
  if (recentBox && recentItems.length) {
    recentBox.hidden = false;
    recentBox.querySelector('[data-recent-list]')!.innerHTML = recentItems
      .slice(0, 6)
      .map((p) => `<a href="${p.url}"><img src="${p.image}" alt="" width="400" height="500" loading="lazy"><span>${esc(p.name)}</span><span class="recent__price">${price(p.price)}</span></a>`)
      .join('');
  }
  pushRecent(data.id);

  /* Taille conseillée mémorisée */
  const mysize = root.querySelector<HTMLElement>('[data-mysize]');
  const showMySize = (value: string) => {
    if (!mysize) return;
    mysize.hidden = false;
    mysize.querySelector('[data-mysize-value]')!.textContent = value;
    const cta = root.querySelector<HTMLElement>('[data-mysize-cta]');
    if (cta) cta.textContent = t('Refaire le calcul →', 'Recalculate →');
  };
  const remembered = $mySize.get();
  if (remembered && mysize) {
    showMySize(remembered);
    selectSize(root, remembered);
  }

  /* Assistant de taille */
  const finder = document.querySelector<HTMLFormElement>('[data-finder]');
  if (finder) {
    const result = finder.querySelector<HTMLElement>('[data-finder-result]')!;
    const sizeEl = finder.querySelector<HTMLElement>('[data-finder-size]')!;
    const note = finder.querySelector<HTMLElement>('[data-finder-note]')!;
    let recommended = '';
    finder.addEventListener(
      'submit',
      (e) => {
        e.preventDefault();
        const h = Number((finder.elements.namedItem('height') as HTMLInputElement).value);
        const w = Number((finder.elements.namedItem('weight') as HTMLInputElement).value);
        const fit = Number((finder.querySelector('input[name="fit"]:checked') as HTMLInputElement)?.value ?? 0);
        if (!(h >= 140 && h <= 215) || !(w >= 35 && w <= 160)) {
          note.textContent = t('Indique une taille entre 140 et 215 cm et un poids entre 35 et 160 kg.', 'Enter a height between 140 and 215 cm and a weight between 35 and 160 kg.');
          result.hidden = false;
          sizeEl.textContent = '—';
          return;
        }
        recommended = recommendSize(h, w, fit);
        $mySize.set(recommended);
        sizeEl.textContent = recommended;
        const available = !root!.querySelector<HTMLInputElement>(`input[name="size"][value="${recommended}"]`)?.disabled;
        note.textContent = available
          ? t('Basé sur des mesures moyennes et la coupe boxy de nos pièces.', 'Based on average measurements and the boxy cut of our pieces.')
          : t(
              `Le ${recommended} est épuisé sur cette pièce : active l'alerte de réassort juste sous le bouton d'achat.`,
              `${recommended} is sold out on this piece: turn on the restock alert just below the buy button.`,
            );
        result.hidden = false;
      },
      { signal },
    );
    finder.querySelector('[data-finder-apply]')?.addEventListener(
      'click',
      () => {
        if (!recommended) return;
        selectSize(root!, recommended);
        showMySize(recommended);
        document.querySelector<HTMLDialogElement>('[data-size-guide]')?.close();
      },
      { signal },
    );
  }

  /* Alerte de réassort (simulée : à relier à l'outil d'e-mailing) */
  const notify = root.querySelector<HTMLFormElement>('[data-notify-form]');
  notify?.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      const email = notify.querySelector<HTMLInputElement>('input[type="email"]')!;
      const msg = root!.querySelector<HTMLElement>('[data-notify-msg]')!;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        email.setAttribute('aria-invalid', 'true');
        msg.textContent = t('Adresse e-mail invalide.', 'Invalid email address.');
        msg.style.color = 'var(--brand)';
        return;
      }
      const size = (notify.elements.namedItem('size') as HTMLSelectElement).value;
      msg.style.color = '';
      msg.textContent = t(`C'est noté : on t'écrit dès que le ${size} revient.`, `Got it: we'll email you as soon as ${size} is back.`);
      notify.hidden = true;
    },
    { signal },
  );
}
