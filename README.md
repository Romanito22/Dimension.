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

## Expérience client

| | |
|---|---|
| **Mon espace** | Page `/compte` (`/en/account`, onglet « Moi » sur mobile) : taille mémorisée + mini-calcul de taille, commandes, favoris, pièces vues, alertes de réassort, e-mail retenu, bouton « tout effacer ». Tout reste dans le navigateur. |
| **Centre d'aide** | Fenêtre ouverte depuis le pied de page, le menu, la fiche produit, le suivi et l'espace client : rappel de la dernière commande, raccourcis (suivi, retour, taille, livraison), FAQ cherchable (sans accents), contacts (formulaire, e-mail, DM TikTok/Instagram). |
| **Retour ou échange en libre-service** | Sur la page de suivi : choix des pièces, échange de taille (les plus proches d'abord) ou remboursement, raison, puis récapitulatif et prochaines étapes. Annulable. Délai : fin de livraison estimée + `returnsDays`. |
| **Acheter le look** | Sur le lookbook, chaque look ouvre une fenêtre avec ses pièces, taille préremplie si elle est mémorisée, possibilité d'en écarter une, tout ajouter en un geste. |
| **Porté avec** | Sur la fiche produit, la pièce associée (`pair` dans `products.json`) ajoutable dans la taille choisie. |
| **Mettre de côté** | Dans le panier, une pièce part dans les favoris (avec « Annuler »). |
| **Emballage cadeau** | Case « C'est un cadeau » au paiement + petit mot (200 caractères), rappelé sur la confirmation. |
| **Bienvenue** | Carte discrète après quelques secondes à la première visite, avec le code `BIENVENUE10` copiable. Ne s'affiche ni au panier ni au paiement, une seule fois. |
| **Rappel du drop** | Bouton « Ajouter à mon agenda » (fichier `.ics`) à côté du compte à rebours. |
| **Reprendre où j'en étais** | Sur l'accueil, retour rapide vers le panier en cours et les dernières pièces vues. |

## Identité visuelle

- **Titres en relief** : classe `patch` (lettres framboise cernées d'encre, épaisseur « extrudée »). Ajoute `patch` à n'importe quel titre.
- **Autocollants** : composant `Sticker` (texte qui tourne en cercle + mot central), utilisé sur l'accueil, la boutique, la fiche produit et le pied de page. Ex. : `<Sticker ring="Drop 01 · en ligne" core="Live" size={120} rot={-10} />`.
- **Rubans croisés** sous l'ouverture : stock en direct (framboise) + signature (crème).
- **Rideau framboise** entre les pages, avec le monogramme (désactivé si l'utilisateur a demandé à réduire les animations).
- **Menu mobile** en plein écran framboise.

## Fenêtres, e-mail, référencement

- Toutes les fenêtres (panier, filtres, menu mobile, guide des tailles, avis, vue 3D, vidéo, photo plein écran) utilisent le même mécanisme : `<dialog data-dialog="nom">` ouvert par un bouton `data-open="nom"` (voir `src/scripts/dialogs.ts`).
- **Un seul e-mail à taper** : saisi une fois (newsletter, commande, alerte, avis, suivi), il est mémorisé sur l'appareil et pré-rempli partout.
- **Référencement** : `/sitemap.xml` (toutes les pages FR + EN avec leurs équivalents), `robots.txt` (pages privées exclues).
- **Site installable** : manifeste et icônes (`public/manifest.webmanifest`, `public/icons/`) — sur téléphone, « Ajouter à l'écran d'accueil » ouvre le site comme une appli.

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

Les demandes de retour/échange (`src/scripts/returns.ts`) sont enregistrées avec la commande (champ `return`). Pour la vraie boutique, envoie-les à ton outil de retours (Boxtal, Sendcloud, Shopify Returns…) qui génère l'étiquette.

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

## Photos

Le site utilise **tes vraies photos**, détourées : gravier, fond gris, filigrane TikTok, logo d'angle et numéros ont été retirés, il ne reste que le vêtement. Les pièces sont reposées sur les couleurs de la marque (studio clair ou framboise) avec une ombre douce.

| Étape | Fichier | Rôle |
|---|---|---|
| Originaux | `tools/visuels/originales/` | Les photos telles que reçues (avec filigrane) |
| 1. Détourage | `tools/visuels/detourer.py` → `tools/visuels/detoures/` | Gomme le filigrane, détoure (modèle BiRefNet via `rembg`), ne garde que le vêtement, redresse la face du Love |
| 2. Composition | `tools/visuels/composer.py` → `public/images/` | Fiches produit, détourés 4:5, catégories, lookbook, bandeaux, grille sociale |

```bash
python -m venv .venv && .venv/bin/pip install "rembg[cpu]" scipy opencv-python-headless
.venv/bin/python tools/visuels/detourer.py   # une fois par nouvelle photo
.venv/bin/python tools/visuels/composer.py   # régénère tous les visuels
```

**T-shirt Love Over Everything** : la boutique et sa fiche utilisent le mockup sur cintre (`dim-001-cintre.jpg`, cintre retiré, encolure refermée) + le gros plan de la vraie broderie du monogramme (le cœur au dos est imprimé) ; ses photos sur gravier servent au reste du site (accueil, devant / dos, table de travail, lookbook, catégories). Pour changer ce choix, modifie `SHOP` dans `composer.py`.

Pour ajouter une photo : dépose-la dans `originales/`, ajoute une ligne dans `JOBS` (`detourer.py`), puis relance les deux scripts. Une image déposée directement dans `public/images/<clé>.webp|jpg|png` est aussi prise telle quelle. Les fiches n'affichent que les vraies photos disponibles (`galleryKeys`) ; un visuel provisoire n'apparaît plus que s'il n'existe aucune photo.

**Ce qui manque encore** (à shooter pour aller plus loin) :
- le **dos** du T-shirt Doodle et du Pull Camo (la face sert pour l'instant des deux côtés) ;
- des **photos portées** (sur modèle) pour chaque pièce, et des gros plans nets en haute définition (les mockups Crew/Splash/Doodle/Camo font ~800 px de large : les gros plans sont un peu doux).

---

## Performance

Mesures Lighthouse (mobile, 4G simulée) avant → après optimisation :

| Page | Performance | Affichage du visuel principal |
|---|---|---|
| Accueil | 32 → ~85 | 9,7 s → 2,0 s (mesuré, réseau et processeur bridés) |
| Boutique | 73 → ~96 | 6,8 s → 1,5 s |
| Fiche produit | 92 → ~97 | 3,2 s → ~2,3 s |

Ce qui a été fait :
- **Images responsives** : chaque vraie photo existe en 480, 800 et 1200 px (`src/pages/img/[name].webp.ts`, générées au build depuis `public/images`), avec `srcset` ; les vignettes (panier, recherche, favoris) utilisent la plus petite.
- **Scène WebGL de l'accueil** : s'allume au premier geste (souris, toucher, scroll, clavier) — l'image fixe s'affiche d'abord ; textures 800 px sur mobile, cadence réduite au repos, figée sur les appareils modestes ou en mode économie de données, arrêt hors écran.
- **Chargement prioritaire** : visuel de l'accueil et premières cartes de la boutique en `fetchpriority="high"`, polices du premier écran préchargées, CSS intégré à la page (`inlineStylesheets: 'always'`).
- **JavaScript découpé par page** : scène, table, paiement, espace client, vue 3D et TikTok ne sont téléchargés que sur leurs pages.
- **Sections lointaines** rendues à l'approche de l'écran (`.cv`, `content-visibility: auto`), animations limitées à `transform` / `opacity`.
- **Transitions plus vives** : rideau entre les pages ~0,45 s, intro 0,65 s passable d'un clic ou d'un toucher.

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
