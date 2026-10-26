// Quiz « Quelle pièce dimension. es-tu ? » : rendu à l'ouverture de la fenêtre,
// résultat mémorisé, ajout au panier en un geste (achat instantané, voir quickadd.ts), partage.
import type { QuickProduct } from './quickadd';
import { persisted, $mySize } from '../lib/saved';
import { t } from './i18n';
import { esc } from './html';

type Scores = Record<string, number>;
interface Data {
  questions: { q: string; a: [string, Scores][] }[];
  results: Record<string, QuickProduct & { url: string; line: string; cart: string }>;
}

const $quiz = persisted<string>('dimension-quiz-v1', '');
const ORDER = ['love', 'crew', 'splash', 'doodle', 'camo'];

export function initQuiz() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-quiz]');
  if (!dialog) return;
  const data = JSON.parse(dialog.querySelector('[data-quiz-json]')!.textContent || '{}') as Data;
  const body = dialog.querySelector<HTMLElement>('[data-quiz-body]')!;
  const step = dialog.querySelector<HTMLElement>('[data-quiz-step]')!;
  const title = dialog.querySelector<HTMLElement>('[data-quiz-title]')!;
  const intro = title.textContent ?? '';
  let i = 0;
  let scores: Scores = {};

  function question() {
    const q = data.questions[i];
    step.textContent = t(`Question ${i + 1} sur ${data.questions.length}`, `Question ${i + 1} of ${data.questions.length}`);
    title.textContent = q.q;
    body.innerHTML = `<div class="quiz__dots" aria-hidden="true">${data.questions.map((_, j) => `<span class="${j <= i ? 'is-on' : ''}"></span>`).join('')}</div>
      <div class="quiz__answers">${q.a.map(([label], j) => `<button type="button" class="quiz__answer" data-quiz-a="${j}">${esc(label)}</button>`).join('')}</div>`;
    body.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }

  function result(art: string) {
    const r = data.results[art];
    if (!r) return question();
    $quiz.set(art);
    const mine = $mySize.get();
    const qa = esc(JSON.stringify({ id: r.id, slug: r.slug, name: r.name, price: r.price, color: r.color, image: r.cart, sizes: r.sizes }));
    step.textContent = t('Ton résultat', 'Your result');
    title.textContent = t('Ta pièce, c’est…', 'Your piece is…');
    body.innerHTML = `<div class="quiz__result">
        <img src="${esc(r.image)}" alt="" width="130" height="162">
        <div>
          <p class="quiz__result-name">${esc(r.name)}</p>
          <p>${esc(r.line)}</p>
        </div>
      </div>
      <p class="label">${mine ? t(`Ta taille ${mine} est déjà repérée`, `Your size ${mine} is highlighted`) : t('Ajoute-le dans ta taille', 'Add it in your size')}</p>
      <div class="quiz__sizes" data-qa="${qa}">${r.sizes
        .map((s) => `<button type="button" data-qa-size="${s.size}" ${s.stock === 0 ? 'disabled' : ''} aria-label="${esc(t(`Ajouter ${r.name}, taille ${s.size}`, `Add ${r.name}, size ${s.size}`))}">${s.size}</button>`)
        .join('')}</div>
      <div class="quiz__acts">
        <a class="btn btn--accent" href="${esc(r.url)}">${t('Voir la pièce', 'See the piece')} <span class="btn__dot" aria-hidden="true"></span></a>
        <button type="button" class="link link--under label" data-quiz-share>${t('Envoyer à un pote', 'Send to a friend')}</button>
        <button type="button" class="link link--under label" data-quiz-again>${t('Recommencer', 'Start again')}</button>
      </div>`;
  }

  function start() {
    i = 0;
    scores = {};
    title.textContent = intro;
    question();
  }

  dialog.addEventListener('dialog:open', () => {
    const last = $quiz.get();
    // Déjà fait : on remontre le résultat, avec « Recommencer »
    if (last && data.results[last]) result(last);
    else start();
  });

  dialog.addEventListener('click', async (e) => {
    const el = e.target as HTMLElement;
    const a = el.closest<HTMLElement>('[data-quiz-a]');
    if (a) {
      const [, pts] = data.questions[i].a[Number(a.dataset.quizA)];
      Object.entries(pts).forEach(([k, v]) => (scores[k] = (scores[k] ?? 0) + v));
      i++;
      if (i < data.questions.length) return question();
      const best = [...ORDER].sort((x, y) => (scores[y] ?? 0) - (scores[x] ?? 0))[0];
      return result(best);
    }
    if (el.closest('[data-quiz-again]')) return start();
    if (el.closest('[data-quiz-share]')) {
      const r = data.results[$quiz.get()];
      if (!r) return;
      const url = new URL(r.url, location.href).href;
      const text = t(`Selon dimension., ma pièce c'est le ${r.name}. Et toi ?`, `According to dimension., my piece is the ${r.name}. What about you?`);
      try {
        if (navigator.share) await navigator.share({ title: 'dimension.', text, url });
        else {
          await navigator.clipboard.writeText(`${text} ${url}`);
          el.textContent = t('Lien copié ✓', 'Link copied ✓');
        }
      } catch {
        /* partage annulé */
      }
    }
  });
}
