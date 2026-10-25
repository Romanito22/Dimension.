// Newsletter & contact — validation côté client. L'envoi est simulé :
// voir README pour brancher Brevo / Klaviyo / Formspree.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateField(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const v = input.value.trim();
  let msg = '';
  if (input.required && !v) msg = 'Ce champ est requis.';
  else if (input.type === 'email' && v && !EMAIL.test(v)) msg = 'Adresse e-mail invalide.';
  else if (input.dataset.pattern && v && !new RegExp(input.dataset.pattern).test(v.replace(/\s/g, ''))) msg = input.dataset.message || 'Format invalide.';
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  const err = input.closest('.field')?.querySelector<HTMLElement>('.field-error');
  if (err) err.textContent = msg;
  return !msg;
}

export function validateAll(root: HTMLElement) {
  const fields = [...root.querySelectorAll<HTMLInputElement>('input, textarea, select')].filter((f) => f.type !== 'radio' && !f.disabled);
  const results = fields.map(validateField);
  const firstBad = fields[results.indexOf(false)];
  firstBad?.focus();
  return results.every(Boolean);
}

export function initForms(signal: AbortSignal) {
  document.querySelectorAll<HTMLFormElement>('[data-newsletter]').forEach((form) => {
    const msg = form.querySelector<HTMLElement>('[data-nl-msg]');
    form.addEventListener(
      'submit',
      (e) => {
        e.preventDefault();
        const input = form.querySelector<HTMLInputElement>('input[type="email"]')!;
        if (!EMAIL.test(input.value.trim())) {
          input.setAttribute('aria-invalid', 'true');
          if (msg) msg.textContent = 'Oups, cette adresse e-mail ne semble pas valide.';
          input.focus();
          return;
        }
        input.setAttribute('aria-invalid', 'false');
        form.querySelector('.nl__field')?.setAttribute('hidden', '');
        if (msg) msg.textContent = 'Bienvenue dans la famille. Ton code −10 % : BIENVENUE10';
      },
      { signal },
    );
  });

  document.querySelectorAll<HTMLFormElement>('[data-contact]').forEach((form) => {
    form.addEventListener(
      'blur',
      (e) => {
        const t = e.target as HTMLInputElement;
        if (t.matches('input, textarea, select') && t.getAttribute('aria-invalid')) validateField(t);
      },
      { capture: true, signal },
    );
    form.addEventListener(
      'submit',
      (e) => {
        e.preventDefault();
        if (!validateAll(form)) return;
        form.hidden = true;
        const ok = document.querySelector<HTMLElement>('[data-contact-ok]');
        if (ok) {
          ok.hidden = false;
          ok.focus();
        }
      },
      { signal },
    );
  });
}
