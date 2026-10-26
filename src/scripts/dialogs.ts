// Fenêtres du site (<dialog data-dialog="nom">) : un seul mécanisme pour toutes.
// - ouverture : n'importe quel bouton [data-open="nom"] (ou openDialog() en script)
// - fermeture : bouton [data-close], clic sur le fond, touche Échap, changement de page
// - le défilement de la page est bloqué tant qu'une fenêtre est ouverte
import { lockScroll, unlockScroll } from './scroll';

const opener = new WeakMap<HTMLDialogElement, HTMLElement | null>();

export function openDialog(dialog: HTMLDialogElement, from: HTMLElement | null = null) {
  if (dialog.open) return;
  opener.set(dialog, from ?? (document.activeElement as HTMLElement | null));
  dialog.showModal();
  lockScroll();
  dialog.dispatchEvent(new CustomEvent('dialog:open', { detail: { opener: from } }));
}

export function initDialogs() {
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const btn = t.closest<HTMLElement>('[data-open]');
    if (btn) {
      const dialog = document.querySelector<HTMLDialogElement>(`dialog[data-dialog="${btn.dataset.open}"]`);
      if (dialog) {
        e.preventDefault();
        openDialog(dialog, btn);
      }
      return;
    }
    const dialog = t.closest<HTMLDialogElement>('dialog[data-dialog]');
    if (dialog && (t === dialog || t.closest('[data-close]'))) dialog.close();
  });
  // « close » ne remonte pas : on l'écoute en phase de capture.
  document.addEventListener(
    'close',
    (e) => {
      const dialog = e.target;
      if (!(dialog instanceof HTMLDialogElement) || dialog.dataset.dialog === undefined) return;
      unlockScroll();
      opener.get(dialog)?.focus?.({ preventScroll: true });
    },
    true,
  );
  document.addEventListener('astro:before-swap', () =>
    document.querySelectorAll<HTMLDialogElement>('dialog[data-dialog][open]').forEach((d) => d.close()),
  );
}
