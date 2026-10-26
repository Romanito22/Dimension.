// Petites attentions pour la personne : accueil « reprends où tu en étais », message de
// bienvenue à la première visite, rappel du prochain drop dans l'agenda.
import { $recent, $welcomed, $lastVisit, $alerts, $wishlist, $mySize } from '../lib/saved';
import { $cart, $count, $subtotal } from '../lib/cart';
import { catalog } from '../lib/catalog';
import { esc } from './html';
import { t, price, link } from './i18n';

/* ---------- Visites : date de la visite précédente, figée pour toute la session ---------- */
export function previousVisit(): Date | null {
  let prev: string | null = null;
  try {
    prev = sessionStorage.getItem('dim-prev-visit');
    if (prev === null) {
      prev = $lastVisit.get();
      sessionStorage.setItem('dim-prev-visit', prev);
      $lastVisit.set(new Date().toISOString());
    }
  } catch {
    /* stockage indisponible : pas de « depuis ta dernière visite » */
  }
  return prev ? new Date(prev) : null;
}

interface News {
  icon: string;
  text: string;
  url: string;
}

/** Ce qui a changé pour la personne depuis sa dernière visite — uniquement des faits du catalogue. */
function whatsNew(prev: Date | null): News[] {
  const items = catalog();
  const out: News[] = [];
  const mine = $mySize.get();
  // Réassorts demandés : la taille attendue est de nouveau en stock
  $alerts.get().forEach((a) => {
    const p = items.find((x) => x.id === a.id);
    if (p && (p.sizes.find((s) => s.size === a.size)?.stock ?? 0) > 0)
      out.push({ icon: '↺', text: t(`Ta taille ${a.size} est de retour sur ${p.name}`, `Your size ${a.size} is back on ${p.name}`), url: p.url });
  });
  // Nouvelles pièces sorties depuis la dernière visite
  const fresh = prev ? items.filter((p) => new Date(p.date) > prev) : [];
  if (fresh.length === 1) out.push({ icon: '✶', text: t(`Nouveau depuis ta dernière visite : ${fresh[0].name}`, `New since your last visit: ${fresh[0].name}`), url: fresh[0].url });
  else if (fresh.length > 1)
    out.push({
      icon: '✶',
      text: t(`${fresh.length} nouveautés depuis ta dernière visite`, `${fresh.length} new pieces since your last visit`),
      url: link('shop'),
    });
  // Favoris presque épuisés (dans ta taille si on la connaît)
  $wishlist.get().forEach((id) => {
    const p = items.find((x) => x.id === id);
    if (!p) return;
    const s = mine ? p.sizes.find((x) => x.size === mine) : null;
    const left = s ? s.stock : p.sizes.reduce((n, x) => n + x.stock, 0);
    if (left > 0 && left <= (s ? 3 : 10))
      out.push({
        icon: '♥',
        text: s ? t(`Plus que ${left} en ${mine} sur ${p.name}, dans tes favoris`, `Only ${left} left in ${mine} on ${p.name}, in your wishlist`) : t(`Plus que ${left} pièces de ${p.name}, dans tes favoris`, `Only ${left} ${p.name} left, in your wishlist`),
        url: p.url,
      });
  });
  return out.slice(0, 4);
}

/* ---------- Accueil : ce que la personne regardait, et son panier ---------- */
export function initResume(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-resume]');
  if (!root) return;
  const prev = previousVisit();
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
    const news = whatsNew(prev);
    const newsBox = root.querySelector<HTMLElement>('[data-resume-news]')!;
    newsBox.hidden = news.length === 0;
    newsBox.querySelector('ul')!.innerHTML = news
      .map((n) => `<li><a href="${esc(n.url)}"><span class="resume__ico" aria-hidden="true">${n.icon}</span><span>${esc(n.text)}</span><span aria-hidden="true">→</span></a></li>`)
      .join('');
    root.querySelector('[data-resume-list]')!.innerHTML = recent
      .map(
        (p) =>
          `<a href="${esc(p.url)}"><img src="${esc(p.image)}" alt="" width="400" height="500" loading="lazy"><span>${esc(p.name)}</span><span class="resume__price">${price(p.price)}</span></a>`,
      )
      .join('');
    root.hidden = n === 0 && recent.length === 0 && news.length === 0;
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
