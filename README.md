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
| **Concept** | « Love over everything » : coton blanc, broderie framboise, soleil sur le gravier. Le petit cercle du logo (« ° ») est le motif récurrent : curseur, puces, séparateurs, états actifs. |
| **Palette** (`src/styles/tokens.css`) | « Chrome Y2K » : noir bleuté `#0B0C0F`, blanc `#E6E9EE`, titres en dégradé chrome argenté, bleu glacé `#8FD8FF` pour les signaux (stock, sélection), reflets holographiques en touches rares. Fonds produits gris studio clair. |
| **Typographies** | *Unbounded* (titres, large et arrondie, en écho au logo liquide) · *Inter Tight* (texte) · *JetBrains Mono* (étiquettes, stock, références) |
| **Accueil** | Intro animée (le monogramme se dessine, une fois par visite) · hero rose bonbon avec matière liquide qui suit la souris, t-shirt détouré en 3D flottante et point cliquable sur le print · nouveautés en défilement horizontal pendant le scroll · pièce signature qui se retourne devant/dos au scroll avec les détails qui s'allument · ruban qui s'incline selon la vitesse de scroll |
| **Interactions** | Cartes produit inclinables avec reflet, boutons aimantés, titres révélés lettre par lettre, grain photo, second visuel au survol des produits, tailles dispo au survol, zoom produit qui suit la souris + plein écran, transitions de page avec morphing de l'image produit, apparitions au scroll, parallaxe légère, curseur cercle, carrousel glissable. Tout est désactivé si l'utilisateur a choisi « réduire les animations ». Bonus : touche **G** pour afficher la grille de mise en page. |

---

## Modifier le contenu

| Quoi | Où |
|---|---|
| Nom, slogan, e-mail, réseaux, frais de port, code promo, bandeau défilant, textes « La marque » | `src/data/brand.json` |
| Produits (nom, prix, couleurs, stock par taille, description, matière, entretien) | `src/data/products.json` |
| FAQ | `src/data/faq.json` |
| Guide des tailles | `src/data/sizes.json` |
| Couleurs, typos, espacements | `src/styles/tokens.css` |
| Mentions légales / CGV (passages surlignés à compléter) | `src/pages/mentions-legales.astro`, `src/pages/cgv.astro` |

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

---

## Structure

```
src/
  data/         brand.json, products.json, faq.json, sizes.json
  styles/       tokens.css (variables), global.css, cart.css
  layouts/      Base.astro (head, SEO, header, footer, panier, curseur)
  components/   Header, Footer, CartDrawer, ProductCard, Img, Logo, Newsletter, SizeTable, LegalPage
  pages/        index, boutique, produit/[slug], panier, commande, la-marque, lookbook, contact, cgv, mentions-legales, 404
                ph/[name].svg.ts → génère les visuels provisoires
  scripts/      app.ts (cycle de vie), cart-ui, shop (filtres), product, checkout, carousel, forms, scroll
  lib/          shop.ts, cart.ts, media.ts (photo réelle ou placeholder), placeholder.ts, logo.ts
public/
  images/       ← dépose tes photos ici
  brand/        ← dépose ton logo ici
```
