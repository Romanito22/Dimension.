// Boutique : filtres (catégorie, taille, couleur, prix), tri et densité,
// synchronisés avec l'URL — tout côté client, instantané.
import { t } from './i18n';

interface State {
  cat: string;
  sizes: string[];
  colors: string[];
  price: string;
  sort: string;
}

const PRICE: Record<string, [number, number]> = {
  'moins-50': [0, 49.99],
  '50-80': [50, 80],
  'plus-80': [80.01, Infinity],
};

export function initShop(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-shop]');
  if (!root) return;
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const cards = [...grid.querySelectorAll<HTMLElement>('[data-card]')];
  const original = [...cards];
  const panel = root.querySelector<HTMLElement>('[data-filters]')!;
  const countEls = root.querySelectorAll<HTMLElement>('[data-count]');
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const chips = root.querySelector<HTMLElement>('[data-chips]')!;
  const sortSel = root.querySelector<HTMLSelectElement>('[data-sort]')!;

  const params = new URLSearchParams(location.search);
  const state: State = {
    cat: params.get('categorie') ?? 'tout',
    sizes: params.get('taille')?.split(',').filter(Boolean) ?? [],
    colors: params.get('couleur')?.split(',').filter(Boolean) ?? [],
    price: params.get('prix') ?? '',
    sort: params.get('tri') ?? 'nouveautes',
  };

  function syncInputs() {
    root!.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat)));
    panel.querySelectorAll<HTMLInputElement>('input[name="size"]').forEach((i) => (i.checked = state.sizes.includes(i.value)));
    panel.querySelectorAll<HTMLInputElement>('input[name="color"]').forEach((i) => (i.checked = state.colors.includes(i.value)));
    panel.querySelectorAll<HTMLInputElement>('input[name="price"]').forEach((i) => (i.checked = i.value === state.price));
    sortSel.value = state.sort;
  }

  function matches(c: HTMLElement) {
    const d = c.dataset;
    if (state.cat !== 'tout' && d.category !== state.cat) return false;
    if (state.sizes.length && !state.sizes.some((s) => d.sizes!.split(',').includes(s))) return false;
    if (state.colors.length && !state.colors.some((s) => d.colors!.split(',').includes(s))) return false;
    if (state.price) {
      const [lo, hi] = PRICE[state.price];
      const p = Number(d.price);
      if (p < lo || p > hi) return false;
    }
    return true;
  }

  function sorted(list: HTMLElement[]) {
    const l = [...list];
    if (state.sort === 'prix-asc') l.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    else if (state.sort === 'prix-desc') l.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    else if (state.sort === 'nouveautes') l.sort((a, b) => b.dataset.date!.localeCompare(a.dataset.date!));
    else return original.filter((c) => l.includes(c));
    return l;
  }

  function writeUrl() {
    const p = new URLSearchParams();
    if (state.cat !== 'tout') p.set('categorie', state.cat);
    if (state.sizes.length) p.set('taille', state.sizes.join(','));
    if (state.colors.length) p.set('couleur', state.colors.join(','));
    if (state.price) p.set('prix', state.price);
    if (state.sort !== 'nouveautes') p.set('tri', state.sort);
    const qs = p.toString();
    history.replaceState(history.state, '', qs ? `?${qs}` : location.pathname);
  }

  function renderChips() {
    const out: string[] = [];
    const lbl = (name: string, v: string) =>
      panel.querySelector<HTMLInputElement>(`input[name="${name}"][value="${v}"]`)?.dataset.label ?? v;
    state.sizes.forEach((s) => out.push(`<button type="button" class="chip" data-chip="size:${s}">${t('Taille', 'Size')} ${s} <span aria-hidden="true">×</span></button>`));
    state.colors.forEach((s) => out.push(`<button type="button" class="chip" data-chip="color:${s}">${lbl('color', s)} <span aria-hidden="true">×</span></button>`));
    if (state.price) out.push(`<button type="button" class="chip" data-chip="price:${state.price}">${lbl('price', state.price)} <span aria-hidden="true">×</span></button>`);
    if (out.length) out.push(`<button type="button" class="chip chip--reset link" data-reset>${t('Tout effacer', 'Clear all')}</button>`);
    chips.innerHTML = out.join('');
    const n = state.sizes.length + state.colors.length + (state.price ? 1 : 0);
    root!.querySelectorAll<HTMLElement>('[data-filter-count]').forEach((el) => (el.textContent = n ? `(${n})` : ''));
  }

  function apply(animate = true) {
    const visible = sorted(cards.filter(matches));
    cards.forEach((c) => (c.hidden = !visible.includes(c)));
    visible.forEach((c, i) => {
      grid.appendChild(c);
      if (animate) {
        c.classList.remove('is-entering');
        c.style.setProperty('--i', String(i % 8));
        void c.offsetWidth;
        c.classList.add('is-entering');
      }
    });
    countEls.forEach((el) => (el.textContent = String(visible.length)));
    empty.hidden = visible.length > 0;
    renderChips();
    writeUrl();
  }

  root.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement;
      const cat = t.closest<HTMLButtonElement>('[data-cat]');
      if (cat) {
        state.cat = cat.dataset.cat!;
        syncInputs();
        apply();
        return;
      }
      const chip = t.closest<HTMLElement>('[data-chip]');
      if (chip) {
        const [k, v] = chip.dataset.chip!.split(':');
        if (k === 'size') state.sizes = state.sizes.filter((s) => s !== v);
        if (k === 'color') state.colors = state.colors.filter((s) => s !== v);
        if (k === 'price') state.price = '';
        syncInputs();
        apply();
        return;
      }
      if (t.closest('[data-reset]')) {
        Object.assign(state, { cat: 'tout', sizes: [], colors: [], price: '' });
        syncInputs();
        apply();
        return;
      }
      if (t.closest('[data-filters-open]')) setPanel(true);
      if (t.closest('[data-filters-close]')) setPanel(false);
      const dens = t.closest<HTMLButtonElement>('[data-density]');
      if (dens) setDensity(dens.dataset.density!);
    },
    { signal },
  );

  panel.addEventListener(
    'change',
    () => {
      state.sizes = [...panel.querySelectorAll<HTMLInputElement>('input[name="size"]:checked')].map((i) => i.value);
      state.colors = [...panel.querySelectorAll<HTMLInputElement>('input[name="color"]:checked')].map((i) => i.value);
      state.price = panel.querySelector<HTMLInputElement>('input[name="price"]:checked')?.value ?? '';
      apply();
    },
    { signal },
  );
  sortSel.addEventListener(
    'change',
    () => {
      state.sort = sortSel.value;
      apply();
    },
    { signal },
  );

  function setPanel(open: boolean) {
    root!.classList.toggle('filters-open', open);
    root!.querySelector('[data-filters-open]')?.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector<HTMLElement>('input, button')?.focus();
  }
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setPanel(false), { signal });

  function setDensity(d: string) {
    grid.dataset.density = d;
    root!.querySelectorAll<HTMLButtonElement>('[data-density]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.density === d)));
    try {
      localStorage.setItem('dimension-density', d);
    } catch {
      /* ignore */
    }
  }
  try {
    const saved = localStorage.getItem('dimension-density');
    if (saved) setDensity(saved);
  } catch {
    /* ignore */
  }

  syncInputs();
  apply(false);
}
