// Petites attentions pour la personne : accueil « reprends où tu en étais », message de
// bienvenue à la première visite, rappel du prochain drop dans l'agenda.
import { $recent, $welcomed } from '../lib/saved';
import { $cart, $count, $subtotal } from '../lib/cart';
import { catalog } from '../lib/catalog';
import { esc } from './html';
import { t, price } from './i18n';

/* ---------- Accueil : ce que la personne regardait, et son panier ---------- */
export function initResume(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-resume]');
  if (!root) return;
  const render = () => {
    const recent = $recent
      .get()
      .map((id) => catalog().find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6) as ReturnType<typeof catalog>;
    const n = $count.get();
    const cart = root.querySelector<HTMLElement>('[data-resume-cart]')!;
    cart.hidden = n === 0;
    root.querySelector('[data-resume-cart-text]')!.textContent = t(
      `${n} pièce${n > 1 ? 's' : ''} · ${price($subtotal.get())} — il n'attend que toi.`,
      `${n} piece${n > 1 ? 's' : ''} · ${price($subtotal.get())} — it's all yours.`,
    );
    root.querySelector('[data-resume-list]')!.innerHTML = recent
      .map(
        (p) =>
          `<a href="${esc(p.url)}"><img src="${esc(p.image)}" alt="" width="400" height="500" loading="lazy"><span>${esc(p.name)}</span><span class="resume__price">${price(p.price)}</span></a>`,
      )
      .join('');
    root.hidden = n === 0 && recent.length === 0;
  };
  const unsub = $cart.listen(render);
  signal.addEventListener('abort', unsub);
  render();
}

/* ---------- Bienvenue : une seule fois, jamais pendant l'achat ---------- */
export function initWelcome() {
  const card = document.querySelector<HTMLElement>('[data-welcome]');
  if (!card || $welcomed.get()) return;
  const close = () => {
    card.classList.remove('is-visible');
    $welcomed.set(true);
    setTimeout(() => (card.hidden = true), 400);
  };
  setTimeout(() => {
    const page = document.querySelector<HTMLElement>('main')?.dataset.page;
    if ($welcomed.get() || page === 'checkout' || page === 'cart' || document.querySelector('dialog[open]')) return;
    card.hidden = false;
    requestAnimationFrame(() => card.classList.add('is-visible'));
  }, 7000);
  card.addEventListener('click', async (e) => {
    const el = e.target as HTMLElement;
    if (el.closest('[data-welcome-close]')) return close();
    const copy = el.closest<HTMLElement>('[data-welcome-copy]');
    if (copy) {
      try {
        await navigator.clipboard.writeText(copy.dataset.welcomeCopy!);
      } catch {
        /* le code reste affiché */
      }
      copy.textContent = t('Code copié ✓', 'Code copied ✓');
      setTimeout(close, 1400);
    }
  });
}

/* ---------- Rappel du prochain drop : fichier .ics pour l'agenda ---------- */
export function initDropReminder(signal: AbortSignal) {
  document.querySelectorAll<HTMLButtonElement>('[data-ics]').forEach((btn) =>
    btn.addEventListener(
      'click',
      () => {
        const start = new Date(btn.dataset.icsDate!);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const ics = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//dimension.//drop//FR',
          'BEGIN:VEVENT',
          `UID:${stamp(start)}@dimensionbrand.fr`,
          `DTSTAMP:${stamp(new Date())}`,
          `DTSTART:${stamp(start)}`,
          `DTEND:${stamp(end)}`,
          `SUMMARY:${btn.dataset.icsTitle}`,
          `DESCRIPTION:${btn.dataset.icsText}`,
          `URL:${location.origin}`,
          'BEGIN:VALARM',
          'TRIGGER:-PT15M',
          'ACTION:DISPLAY',
          `DESCRIPTION:${btn.dataset.icsTitle}`,
          'END:VALARM',
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
        a.download = 'dimension-drop.ics';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        btn.textContent = t('Ajouté à ton agenda ✓', 'Added to your calendar ✓');
      },
      { signal },
    ),
  );
}
