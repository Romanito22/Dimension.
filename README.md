# dimension. — site e-commerce

> *Love over everything.*

Site de la marque **dimension.** (@dimensionbrand) : accueil éditorial, boutique filtrable, fiches produit, panier latéral, tunnel de commande, la marque, lookbook, contact/FAQ.

- **Stack** : [Astro 6](https://astro.build) (site statique ultra-rapide) + TypeScript + CSS natif, transitions de page (View Transitions), smooth scroll ([Lenis](https://lenis.darkroom.engineering/)), panier en [nanostores](https://github.com/nanostores/nanostores) + `localStorage`.
- **Aucune base de données** : tout le contenu est dans `src/data/*.json`.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # génère le site dans dist/
npm run preview  # prévisualise le build
```

Node.js ≥ 22.12 requis. Pour mettre en ligne : importer le dépôt sur **Vercel** ou **Netlify** (détection Astro automatique, aucun réglage).

---

## Direction artistique

| | |
|---|---|
| **Concept** | L'identité reprend le logo brodé : titres « patch » (framboise, contour noir, relief), boutons et cartes cernés de noir avec ombre franche, points de broderie, pièces posées à plat sur le gravier comme sur les photos de la marque. Le petit cercle du logo reste le motif du curseur. |
| **Palette** (`src/styles/tokens.css`) | « Patch brodé » — les couleurs de la marque : framboise du monogramme brodé `#C2124F`, noir du contour `#111111`, coton `#F3F1EC`, sable du T-shirt Crew `#E9D7B9`, gravier des photos. Les sections alternent coton / noir / framboise / sable (classes `.theme-dark`, `.theme-brand`, `.theme-sand`). |
| **Typographies** | *Unbounded* (titres, large et arrondie, en écho au logo liquide) · *Inter Tight* (texte) · *JetBrains Mono* (étiquettes, stock, références) |
| **Accueil** | Scène du drop posée sur le gravier (WebGL : lumière de soleil qui suit le pointeur, ombre portée, dissolution framboise), achat en un clic par taille, table de travail où l'on déplace les pièces à plat, manifeste sur fond framboise qui s'allume mot par mot ·  Intro animée (le monogramme se dessine, une fois par visite) · hero rose bonbon avec matière liquide qui suit la souris, t-shirt détouré en 3D flottante et point cliquable sur le print · nouveautés en défilement horizontal pendant le scroll · pièce signature qui se retourne devant/dos au scroll avec les détails qui s'allument · ruban qui s'incline selon la vitesse de scroll |
| **Interactions** | Cartes produit inclinables avec reflet, boutons aimantés, titres révélés lettre par lettre, grain photo, second visuel au survol des produits, tailles dispo au survol, zoom produit qui suit la souris + plein écran, transitions de page avec morphing de l'image produit, apparitions au scroll, parallaxe légère, curseur cercle, carrousel glissable. Tout est désactivé si l'utilisateur a choisi « réduire les animations ». Bonus : touche **G** pour afficher la grille de mise en page. |

---

## Fonctionnalités d'achat

| | |
|---|---|
| **Recherche instantanée** | Bouton de l'en-tête, touche `/` ou `Ctrl/⌘ + K`. Insensible aux accents, navigation au clavier (↑ ↓ Entrée), suggestions et pièces vues récemment. |
| **Favoris** | Cœur sur chaque carte et fiche, compteur dans l'en-tête, page `/favoris` avec ajout au panier par taille (enregistré dans le navigateur). |
| **Achat instantané** | Tailles cliquables dans le hero, sur les cartes, dans les favoris et dans les suggestions du panier. |
| **Assistant de taille** | Dans le guide des tailles : taille + poids + coupe voulue → taille conseillée, sélectionnée en un clic et mémorisée pour les autres fiches. |
| **Alerte de réassort** | « Préviens-moi » sur les tailles épuisées (envoi simulé, à relier à l'outil d'e-mailing). |
| **Livraison estimée** | Dates calculées en jours ouvrés (envoi le jour même avant 14 h). |
| **Panier** | Suggestions « Complète ton look », barre de livraison offerte, « Annuler » après un retrait. |
| **Fiche produit** | Pièces vues récemment, bouton Partager, **vue 3D** (rotation au doigt), **vidéo portée**, **mesures du modèle**, **avis clients**. |
| **Suivi de commande** | Page `/suivi` (`/en/track`) : numéro + e-mail → frise des étapes (confirmée, préparée, expédiée, en livraison, livrée). Lien direct depuis la confirmation. |
| **Vidéos TikTok** | Sur l'accueil, cartes verticales qui ouvrent le lecteur TikTok au clic (rien n'est chargé chez TikTok avant). |
| **Version anglaise** | Tout le site existe en anglais sous `/en/` (bouton FR/EN dans l'en-tête, le menu et le pied de page). |

## Version anglaise

- Les adresses françaises ne changent pas ; l'anglais est servi sous `/en/` : `/en/shop`, `/en/product/<slug>`, `/en/about`, `/en/track`… (table dans `src/i18n/index.ts`).
- Les textes des pages sont écrits côte à côte : `t('Boutique', 'Shop')`. Pour corriger une traduction, cherche le texte français dans `src/views/` ou `src/components/` et modifie la deuxième valeur.
- Les données ont un bloc `"en"` : produits (`products.json`), marque (`brand.json`), FAQ (`faq.json`), guide des tailles (`sizes.json`). Un champ absent du bloc `"en"` reprend le français.
- Les pages elles-mêmes sont dans `src/views/` ; `src/pages/` ne contient que les adresses (français et `en/`).

## Fiche produit : vidéo, 360°, modèle, avis

| Quoi | Comment |
|---|---|
| **Vidéo portée** | Dépose `public/videos/dim-001.mp4` (id du produit en minuscules, MP4 H.264, ~6–10 s, format 4:5, sans son, < 4 Mo). Elle apparaît dans la galerie, en lecture automatique et muette. |
| **Vue 360°** | Dépose une série de photos `public/images/spin/dim-001/01.webp`, `02.webp`… (24 à 36 photos tournant autour de la pièce, fond uni, même cadrage). Sans ces photos, le bouton « Vue 3D » fait tourner le devant et le dos détourés. |
| **Porté par** | Champ `model` de chaque produit dans `products.json` : `{ "height": 180, "size": "M" }` — **à remplacer par les vraies mesures du modèle du shooting**. |
| **Avis clients** | `src/data/reviews.json` est **vide** : la section affiche « Pas encore d'avis » et un formulaire (envoi simulé, à relier à Judge.me, Trustpilot ou Google). N'y mets que de **vrais avis** : `{ "product": "DIM-001", "author": "Léa", "rating": 5, "title": "…", "text": "…", "size": "M", "fit": 0, "date": "2026-11-02", "verified": true }` (`fit` : −1 taille petit, 0 taille bien, 1 taille grand). La note moyenne s'affiche alors près du prix et dans les données Google. |

## Vidéos TikTok

Colle les liens de tes vidéos dans `src/data/tiktok.json` :

```json
{
  "videos": [
    { "url": "https://www.tiktok.com/@dimensionbrand/video/7412345678901234567", "caption": "Le LOVE au soleil" }
  ]
}
```

- La miniature est récupérée automatiquement chez TikTok au moment du build. Pour choisir la tienne, dépose `public/images/tiktok/<numéro de la vidéo>.jpg` (format 9:16).
- Tant que la liste est vide, l'accueil affiche une grille de visuels qui renvoie vers ton profil.
- Le lecteur TikTok ne se charge qu'au clic sur une vidéo (meilleur pour la vitesse et le RGPD).

## Suivi de commande

En mode démo, la commande est enregistrée dans le navigateur au moment de la confirmation, et les étapes sont **estimées** à partir de la date et du mode de livraison (jours ouvrés, jours fériés exclus). Une fois le paiement branché, relie la page au transporteur (Colissimo, Chronopost, Mondial Relay ou Boxtal) pour afficher les vrais passages du colis : tout est dans `src/scripts/track.ts`.

## Modifier le contenu

| Quoi | Où |
|---|---|
| Nom, slogan, e-mail, réseaux, frais de port, code promo, bandeau défilant, textes « La marque » | `src/data/brand.json` |
| Produits (nom, prix, couleurs, stock par taille, description, matière, entretien) | `src/data/products.json` |
| FAQ | `src/data/faq.json` |
| Guide des tailles | `src/data/sizes.json` |
| Couleurs, typos, espacements | `src/styles/tokens.css` |
| Mentions légales / CGV (passages surlignés à compléter, FR + EN) | `src/views/Legal.astro`, `src/views/Terms.astro` |
| Vidéos TikTok | `src/data/tiktok.json` |
| Avis clients (vrais avis uniquement) | `src/data/reviews.json` |

**Ajouter un produit** : copier un bloc dans `products.json`, changer `id` (ex. `DIM-006`), `slug` (l'URL), etc. Le champ `art` choisit le visuel provisoire (`love`, `crew`, `splash`, `doodle`, `camo`) : il disparaît dès que tu déposes les photos.

### ⚠️ Hypothèses à valider

Ces infos ont été posées par défaut, change-les dans les fichiers JSON :

- **Prix** : t-shirts 45 € (Love Over Everything 49 €), pull Camo 95 €.
- **Noms des pièces** : *T-shirt Love Over Everything*, *T-shirt Crew* (sable, silhouettes), *T-shirt Splash* (noir), *T-shirt Doodle* (écru), *Pull Camo*.
- **Matières** : coton 240 g/m² pour les t-shirts, maille 70 % coton / 30 % laine pour le pull.
- **Stocks** par taille, **livraison** (offerte dès 80 €, relais 3,90 €, domicile 5,90 €, express 11,90 €), **retours** 14 jours, code **BIENVENUE10** (−10 %).
- **E-mail** `contact@dimensionbrand.fr`, compte **Instagram** `@dimensionbrand`, nom de domaine `dimensionbrand.fr`.
- **Textes de marque** (histoire, engagements) : écrits dans ton ton, à relire et personnaliser.

---

## Logo

Le monogramme « d° » est redessiné en vectoriel, et le mot « dimension. » est rendu provisoirement avec une police proche. **Pour utiliser ton vrai logo**, dépose :

- `public/brand/monogram.svg` → le « d° » seul (header, footer, badges)
- `public/brand/logo.svg` → le logo complet (optionnel)

Le site les utilise automatiquement. Idéalement en SVG, sinon en PNG transparent (min. 1000 px de large).

---

## Photos à produire

Le site affiche des **visuels provisoires** qui redessinent chaque pièce. Chaque visuel indique en bas à droite le chemin exact du fichier qui le remplacera. **Dépose une photo au bon chemin (`.jpg`, `.webp` ou `.png`), relance le build : elle remplace automatiquement le placeholder.**

> Conseils : JPG qualité 80–85 ou WebP, < 500 Ko par image. Pas de filigrane TikTok sur les photos du site (utilise les originaux).

### Produits — 4 photos par pièce, format 4:5 (1600 × 2000 px)

| Fichier | Contenu | Fond |
|---|---|---|
| `public/images/products/dim-00X-1.jpg` | **Face**, à plat ou sur cintre, bien centré | gris clair uni (comme tes mockups) |
| `…-2.jpg` | **Dos** (s'affiche au survol dans la boutique) | gris clair uni |
| `…-3.jpg` | **Détail** : broderie / print / maille en gros plan | libre |
| `…-4.jpg` | **Ambiance** : à plat sur le gravier au soleil, ou porté | gravier / extérieur |

Soit 5 pièces × 4 = **20 photos** (`dim-001` = Love Over Everything, `dim-002` = Crew, `dim-003` = Splash, `dim-004` = Doodle, `dim-005` = Pull Camo).

**Tes photos actuelles peuvent déjà servir** (version sans filigrane) :
- T-shirt blanc, monogramme brodé (vue de face en diagonale) → `products/dim-001-1.jpg`
- T-shirt blanc, dos LOVE à plat → `products/dim-001-2.jpg` **et** `hero/desktop.jpg`
- Gros plan du monogramme près du col → `products/dim-001-3.jpg` et `story/1.jpg`
- Dos LOVE en diagonale → `products/dim-001-4.jpg`
- Mockups Crew, Splash, Doodle, Camo (face/dos séparés) → `dim-002-1/2`, `dim-003-1/2`, `dim-004-1`, `dim-005-1`

### Pages

| Fichier | Format | Taille | Contenu |
|---|---|---|---|
| `cutout/dim-00X-front.png` et `cutout/dim-00X-back.png` | 4:5, **PNG détouré (fond transparent)** | 2000 × 2500 | Chaque pièce à plat, face et dos, sans fond : elles apparaissent sous le projecteur du hero et dans la section « Devant / Dos » (10 fichiers) |
| `hero/desktop.jpg` | 16:9 | 2560 × 1440 | Image de partage sur les réseaux (Open Graph) |
| `categories/t-shirts.jpg`, `categories/maille.jpg`, `categories/love.jpg` | 3:4 | 1500 × 2000 | Tuiles catégories de l'accueil |
| `story/1.jpg`, `story/3.jpg` | 4:5 | 1600 × 2000 | Page « La marque » (détails, atelier, mains) |
| `story/2.jpg` | 16:9 | 2560 × 1440 | Grand bandeau « La marque » |
| `lookbook/1.jpg` … `lookbook/9.jpg` | 1, 5, 9 en 16:9 · les autres en 4:5 | 2560 × 1440 / 1600 × 2000 | Lookbook Drop 01 |
| `social/1.jpg` … `social/6.jpg` | 1:1 | 1080 × 1080 | Grille TikTok / Instagram |

**Total : 20 photos produit + 10 détourés + 21 photos de pages.** Astuce détourage : remove.bg ou Photoshop « Sélectionner le sujet », puis export PNG.

---

## Brancher les vrais services

Tout fonctionne en local, mais trois éléments sont **simulés** :

1. **Paiement** (`src/scripts/checkout.ts`) : le tunnel est complet (validation, livraison, code promo, confirmation) mais aucun paiement n'est débité. Pour encaisser : [Stripe Checkout](https://stripe.com/docs/payments/checkout) via une fonction serverless (Vercel/Netlify), ou [Shopify Buy Button / Storefront API](https://shopify.dev/docs/storefronts/headless) si tu préfères gérer stocks et commandes dans Shopify.
2. **Newsletter** (`src/scripts/forms.ts`) : à relier à Brevo, Klaviyo ou Mailchimp (formulaire d'inscription ou API).
3. **Formulaire de contact** : à relier à Formspree, Basin ou une fonction serverless.
4. **Avis clients** : formulaire à relier à Judge.me, Trustpilot ou Google Avis clients.
5. **Suivi de commande** : à relier au transporteur (voir plus haut).

---

## Structure

```
src/
  data/         brand.json, products.json, faq.json, sizes.json, reviews.json, tiktok.json
  i18n/         langues et adresses des pages (FR à la racine, EN sous /en/)
  views/        contenu des pages, partagé entre français et anglais
  styles/       tokens.css (variables), global.css, cart.css
  layouts/      Base.astro (head, SEO, header, footer, panier, curseur)
  components/   Header, Footer, CartDrawer, ProductCard, Img, Logo, Newsletter, SizeTable, LegalPage
  pages/        adresses françaises (index, boutique, produit/[slug], suivi…) et anglaises (en/…)
                ph/[name].webp.ts → génère les visuels provisoires (WebP)
  scripts/      app.ts (cycle de vie), cart-ui, shop (filtres), product, checkout, carousel, forms, scroll
  lib/          shop.ts, cart.ts, media.ts (photo réelle ou placeholder), placeholder.ts, logo.ts
public/
  images/       ← dépose tes photos ici
  brand/        ← dépose ton logo ici
```
