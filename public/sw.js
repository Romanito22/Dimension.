// Service worker dimension. : les pages et images déjà vues restent disponibles hors ligne,
// et les visites suivantes s'affichent plus vite. Change VERSION pour repartir d'un cache vide.
const VERSION = 'dim-v1';

const OFFLINE = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hors ligne — dimension.</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#C2124F;color:#fff;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}
h1{font-size:2rem;margin:0 0 .5rem}button{margin-top:1.25rem;padding:.9rem 1.4rem;border:2px solid #111;border-radius:999px;background:#fff;color:#111;font-weight:700;font-size:1rem}</style>
<main><h1>Pas de réseau.</h1><p>Ton panier et tes favoris sont bien gardés.<br>Reviens dès que ça capte — on t'attend.</p>
<button onclick="location.reload()">Réessayer</button></main></html>`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Pages : toujours la version en ligne si possible, sinon la dernière vue, sinon la page hors ligne
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))),
    );
    return;
  }

  // Scripts, styles, polices, images : depuis le cache tout de suite, mis à jour en arrière-plan
  if (/\.(js|css|woff2|webp|png|jpe?g|svg|webmanifest)$/.test(url.pathname)) {
    const cached = caches.open(VERSION).then((c) => c.match(req));
    // Fichiers du build (nom avec empreinte) : immuables, le cache suffit
    if (url.pathname.includes('/_astro/')) {
      event.respondWith(
        cached.then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok) {
                const copy = res.clone();
                caches.open(VERSION).then((c) => c.put(req, copy));
              }
              return res;
            }),
        ),
      );
      return;
    }
    const fresh = fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    });
    event.respondWith(cached.then((hit) => hit || fresh));
    event.waitUntil(fresh.catch(() => {}));
  }
});
