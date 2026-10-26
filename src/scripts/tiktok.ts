// Lecteur TikTok : l'iframe n'est créée qu'au clic, et retirée à la fermeture (la vidéo s'arrête).
export function initTikTok(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-tiktok]');
  const dialog = root?.querySelector<HTMLDialogElement>('[data-tt-dialog]');
  if (!root || !dialog) return;
  const videos = JSON.parse(root.querySelector('[data-tt-json]')!.textContent || '[]') as { id: string; url: string }[];
  const frame = dialog.querySelector<HTMLElement>('[data-tt-frame]')!;
  const link = dialog.querySelector<HTMLAnchorElement>('[data-tt-link]')!;
  let current = 0;

  function load(i: number) {
    current = (i + videos.length) % videos.length;
    const v = videos[current];
    frame.innerHTML = `<iframe src="https://www.tiktok.com/player/v1/${v.id}?autoplay=1&loop=1&music_info=1&description=1&rel=0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen title="TikTok"></iframe>`;
    link.href = v.url;
  }

  // Ouverture / fermeture : voir dialogs.ts ; ici on charge la bonne vidéo.
  dialog.addEventListener(
    'dialog:open',
    (e) => load(Number((e as CustomEvent<{ opener: HTMLElement | null }>).detail.opener?.dataset.ttPlay ?? 0)),
    { signal },
  );
  dialog.addEventListener(
    'click',
    (e) => {
      const el = e.target as HTMLElement;
      if (el.closest('[data-tt-prev]')) load(current - 1);
      else if (el.closest('[data-tt-next]')) load(current + 1);
    },
    { signal },
  );
  dialog.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'ArrowLeft') load(current - 1);
      if (e.key === 'ArrowRight') load(current + 1);
    },
    { signal },
  );
  dialog.addEventListener('close', () => (frame.innerHTML = ''), { signal });
}
