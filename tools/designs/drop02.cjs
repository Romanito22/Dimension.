// Drop 02 — propositions de t-shirts dans l'univers dimension.
// Chaque visuel est dessiné en SVG puis exporté en PNG transparent à 300 dpi (fichier d'impression),
// et posé sur une maquette de t-shirt (face + dos) pour la planche de présentation.
//
//   node tools/designs/drop02.cjs            → tout
//   node tools/designs/drop02.cjs heartbeat  → un seul modèle
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUT = path.join(__dirname, '../../design/drop-02');
const CM = 11.6; // unités de maquette par cm (dos d'un boxy taille L ≈ 56 cm)

const FONTS =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Grenze+Gotisch:wght@700;900&family=Inter+Tight:wght@600;800&family=JetBrains+Mono:wght@600;800&family=Modak&family=Pirata+One&family=Unbounded:wght@600;800&display=block';

const C = {
  brand: '#C2124F',
  pink: '#FF4F8B',
  blush: '#FFC9DA',
  wine: '#4A0619',
  ink: '#151515',
  white: '#F7F5F0',
  sand: '#ECD9BC',
};

// ── outils ──────────────────────────────────────────────────────────────────
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;

// Trait « fait main » : on rééchantillonne la ligne, on la fait trembler un peu, puis on lisse (Catmull-Rom)
function hand(points, { amp = 2.2, step = 14, seed = 1, closed = false } = {}) {
  const r = rng(seed);
  const pts = [];
  const src = closed ? [...points, points[0]] : points;
  for (let i = 0; i < src.length - 1; i++) {
    const [x1, y1] = src[i];
    const [x2, y2] = src[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      pts.push([x1 + (x2 - x1) * t + (r() - 0.5) * amp, y1 + (y2 - y1) * t + (r() - 0.5) * amp]);
    }
  }
  pts.push(closed ? pts[0] : src[src.length - 1]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

// Échantillonne une courbe paramétrique en points
const sample = (fn, n, a = 0, b = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => fn(a + ((b - a) * i) / n));
// Cœur classique, pointe en bas
const heartPt = (cx, cy, s) => (t) => [cx + s * 16 * Math.sin(t) ** 3, cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];

// Monogramme d° (mêmes tracés que le site, viewBox 0 0 104 100)
const MONO_BOWL = 'M10 66a28 28 0 1 0 56 0a28 28 0 1 0 -56 0Z M23 64a14 14 0 1 0 28 0a14 14 0 1 0 -28 0Z';
const MONO_STEM = 'M54 34C54 15 66 5 80 6C93 7 99 19 95 30C93 36 87 40 81 38C87 33 88 24 83 18C77 12 68 16 68 32L68 88Q68 97 61 97Q54 97 54 88Z';
const mono = (x, y, size, fill, ring = fill, ringW = 1.6) =>
  `<g transform="translate(${x} ${y}) scale(${size / 100})"><path d="${MONO_BOWL}" fill="${fill}" fill-rule="evenodd"/><path d="${MONO_STEM}" fill="${fill}"/><circle cx="98" cy="7" r="4.2" fill="none" stroke="${ring}" stroke-width="${ringW}"/></g>`;

// Petite étoile à 4 branches
const sparkle = (x, y, r, fill) =>
  `<path d="M${x} ${y - r}C${x + r * 0.12} ${y - r * 0.12} ${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y}C${x + r * 0.12} ${y + r * 0.12} ${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r}C${x - r * 0.12} ${y + r * 0.12} ${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y}C${x - r * 0.12} ${y - r * 0.12} ${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r}Z" fill="${fill}"/>`;

// Coulures de bombe sous une ligne de texte
function drips(list, color) {
  return list
    .map(([x, y, len, w]) => `<path d="M${x - w / 2} ${y}L${x - w / 2} ${y + len}A${w / 2} ${w / 2} 0 0 0 ${x + w / 2} ${y + len}L${x + w / 2} ${y}Z" fill="${color}"/><circle cx="${x}" cy="${y + len + w * 0.35}" r="${w * 0.78}" fill="${color}"/>`)
    .join('');
}

// Effet bombe : bords doux, nuage de gouttelettes autour, quelques trous dans l'aplat
const sprayFilter = (id, color, seed = 3) => `
<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${seed}" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3 1.75" result="dots"/>
  <feGaussianBlur in="SourceAlpha" stdDeviation="11" result="halo"/>
  <feComposite in="dots" in2="halo" operator="in" result="spk"/>
  <feFlood flood-color="${color}" result="col"/>
  <feComposite in="col" in2="spk" operator="in" result="overspray"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${seed + 7}" result="n2"/>
  <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 7 -1.55" result="mottle"/>
  <feComposite in="dots" in2="mottle" operator="arithmetic" k2="1" k3="1" result="keep"/>
  <feGaussianBlur in="SourceGraphic" stdDeviation="1.3" result="soft"/>
  <feComposite in="soft" in2="keep" operator="in" result="body"/>
  <feMerge><feMergeNode in="overspray"/><feMergeNode in="body"/></feMerge>
</filter>`;

// Usure de tampon / sérigraphie vieillie
const wornFilter = (id, seed = 5, strength = 1) => `
<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" result="fine"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${seed + 2}" result="big"/>
  <feComposite in="fine" in2="big" operator="arithmetic" k2="0.55" k3="0.75" result="mix"/>
  <feColorMatrix in="mix" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${-9 * strength} ${5.2 + 0.4 * (1 - strength)}" result="m"/>
  <feComposite in="SourceGraphic" in2="m" operator="out"/>
</filter>`;

// ── les modèles ─────────────────────────────────────────────────────────────
// Chaque modèle : couleur du t-shirt, et pour chaque face un visuel (taille du canevas, largeur imprimée en cm, position)
const designs = [];

// 1. HEARTBEAT — la ligne d'un électrocardiogramme qui dessine un cœur
{
  const heart = (x, y, s) => hand(sample(heartPt(x, y, s), 120, Math.PI, Math.PI * 3), { amp: 0, step: 999, closed: false });
  const T = 420; // la ligne de base passe par la pointe du cœur
  const line = `M28 ${T}L205 ${T}C217 ${T} 223 ${T - 24} 236 ${T - 24}C249 ${T - 24} 255 ${T} 267 ${T}L298 ${T}L314 ${T + 28}L344 ${T - 230}L374 ${T + 112}L394 ${T}L600 ${T}`;
  const tail = `M600 ${T}L752 ${T}C764 ${T} 770 ${T - 18} 781 ${T - 18}C792 ${T - 18} 798 ${T} 810 ${T}L972 ${T}`;
  // cœur dont la pointe est posée sur la ligne (paramétrage : t=π → pointe)
  const hp = sample(heartPt(600, 0, 11.8), 160, Math.PI, Math.PI * 3);
  const dy = T - hp[0][1];
  const hd = hand(hp.map(([x, y]) => [x, y + dy]), { amp: 0, step: 4 });
  const back = `
  <defs>
    <linearGradient id="hb-fade" gradientUnits="userSpaceOnUse" x1="20" x2="980">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="${line}" fill="none" stroke="url(#hb-fade)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${tail}" fill="none" stroke="url(#hb-fade)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${hd}" fill="none" stroke="${C.pink}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="58" y="${T - 40}" font-family="JetBrains Mono" font-weight="800" font-size="32" fill="${C.pink}" letter-spacing="3">BPM ∞</text>
  <text x="500" y="${T + 190}" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="31" fill="#fff" letter-spacing="9">LOVE OVER EVERYTHING</text>`;
  const hp2 = sample(heartPt(200, 0, 5.4), 140, Math.PI, Math.PI * 3);
  const T2 = 170;
  const dy2 = T2 - hp2[0][1];
  const front = `
  <path d="M14 ${T2}L72 ${T2}L82 ${T2 + 12}L98 ${T2 - 96}L114 ${T2 + 36}L124 ${T2}L200 ${T2}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M200 ${T2}L386 ${T2}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
  <path d="${hand(hp2.map(([x, y]) => [x, y + dy2]), { amp: 0, step: 3 })}" fill="none" stroke="${C.pink}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="200" y="${T2 + 78}" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="21" fill="#fff" letter-spacing="7">DIMENSION</text>`;
  designs.push({
    id: 'heartbeat',
    name: 'Heartbeat',
    tee: '#161616',
    dark: true,
    pitch: "La ligne d'un électrocardiogramme qui, à un moment, dessine un cœur. Dans le dos : « Love over everything ». BPM : ∞.",
    tech: 'Sérigraphie 2 couleurs (blanc + rose) · ou broderie pour le devant',
    front: { w: 400, h: 260, cm: 10, svg: front },
    back: { w: 1000, h: 640, cm: 31, top: 8, svg: back },
  });
}

// 2. BUBBLE — « dimension » en lettres bulles, comme le cœur LOVE, sur un t-shirt framboise
{
  // Reflets en aplat : un éclairage sur la forme floutée, puis seuillé pour rester imprimable en couleurs pleines
  const gloss = (id, blur, color, azimuth, table, erode) => `
  <filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="b"/>
    <feSpecularLighting in="b" surfaceScale="9" specularConstant="1.1" specularExponent="18" result="s"><feDistantLight azimuth="${azimuth}" elevation="40"/></feSpecularLighting>
    <feComponentTransfer in="s" result="t"><feFuncA type="discrete" tableValues="${table}"/></feComponentTransfer>
    <feMorphology in="SourceAlpha" operator="erode" radius="${erode}" result="in"/>
    <feComposite in="t" in2="in" operator="in" result="m"/>
    <feFlood flood-color="${color}"/><feComposite in2="m" operator="in"/>
  </filter>`;
  const word = (extra) =>
    `<text x="500" y="352" text-anchor="middle" font-family="Modak" font-size="198" letter-spacing="-12" rotate="-8 4 -5 7 -4 6 -7 3 8" ${extra}>dimension</text>`;
  const back = `
  <defs>${gloss('bb-hi', 10, '#fff', 225, '0 0 0 0 1 1', 5)}${gloss('bb-lo', 10, '#F7A6C2', 45, '0 0 0 1 1 1', 3)}</defs>
  <g transform="translate(11 15)">${word(`fill="${C.wine}" stroke="${C.wine}" stroke-width="28" stroke-linejoin="round"`)}</g>
  ${word(`fill="${C.blush}" stroke="${C.wine}" stroke-width="28" stroke-linejoin="round" paint-order="stroke"`)}
  <g filter="url(#bb-lo)">${word('fill="#000"')}</g>
  <g filter="url(#bb-hi)">${word('fill="#000"')}</g>
  ${sparkle(110, 150, 34, '#fff')}${sparkle(160, 212, 15, C.blush)}${sparkle(890, 470, 38, '#fff')}${sparkle(842, 528, 16, C.blush)}${sparkle(905, 160, 14, '#fff')}
  <text x="500" y="562" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="30" fill="#fff" letter-spacing="10">LOVE OVER EVERYTHING</text>`;
  const m = (fill, extra = '') => `<g transform="translate(40 30) scale(2.6)" ${extra}><path d="${MONO_BOWL}" fill="${fill}" fill-rule="evenodd"/><path d="${MONO_STEM}" fill="${fill}"/></g>`;
  const front = `
  <defs>${gloss('bf-hi', 7, '#fff', 225, '0 0 0 0 1 1', 4)}${gloss('bf-lo', 7, '#F7A6C2', 45, '0 0 0 1 1 1', 2)}</defs>
  <g transform="translate(6 8)">${m(C.wine, `stroke="${C.wine}" stroke-width="5.5" stroke-linejoin="round"`)}</g>
  ${m(C.blush, `stroke="${C.wine}" stroke-width="5.5" stroke-linejoin="round" paint-order="stroke"`)}
  <g filter="url(#bf-lo)">${m('#000')}</g>
  <g filter="url(#bf-hi)">${m('#000')}</g>
  <circle cx="${40 + 98 * 2.6}" cy="${30 + 7 * 2.6}" r="${4.2 * 2.6}" fill="none" stroke="#fff" stroke-width="5"/>
  ${sparkle(330, 120, 16, '#fff')}`;
  designs.push({
    id: 'bubble',
    name: 'Bubble',
    tee: '#B3124B',
    dark: true,
    pitch: 'Le grand frère du cœur LOVE : « dimension » en lettres bulles gonflées, sur un t-shirt framboise. Devant, le d° en bulle.',
    tech: 'Sérigraphie 4 couleurs, encre gonflante (puff) sur le rose pâle',
    front: { w: 360, h: 320, cm: 9, svg: front },
    back: { w: 1000, h: 640, cm: 33, top: 6, svg: back },
  });
}

// 3. JUSQU'À PAS D'HEURE — pochoir à la bombe, le t-shirt de la bande
{
  const back = `
  <defs>${sprayFilter('sp-a', C.sand, 4)}${sprayFilter('sp-b', C.sand, 9)}</defs>
  <g filter="url(#sp-a)" fill="${C.sand}">
    <text x="118" y="230" font-family="Unbounded" font-weight="800" font-size="210">*</text>
    <g transform="rotate(-4 500 600)">
      <text x="515" y="410" text-anchor="middle" font-family="Pirata One" font-size="250">jusqu’à</text>
      <text x="500" y="690" text-anchor="middle" font-family="Pirata One" font-size="330">pas</text>
      <text x="505" y="930" text-anchor="middle" font-family="Pirata One" font-size="250">d’heure</text>
      ${drips([[402, 380, 70, 9], [618, 395, 120, 8], [372, 668, 150, 10], [565, 676, 95, 9], [690, 905, 135, 9], [312, 918, 60, 8]], C.sand)}
    </g>
  </g>
  <g filter="url(#sp-b)" fill="${C.sand}">
    <text x="500" y="1150" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="30" letter-spacing="8">DIMENSION. ✶ LA BANDE</text>
  </g>`;
  const front = `
  <defs>${sprayFilter('sp-f', C.sand, 2)}</defs>
  <g filter="url(#sp-f)" fill="${C.sand}">
    <text x="40" y="250" font-family="Unbounded" font-weight="800" font-size="230">*</text>
    ${mono(205, 70, 120, C.sand, C.sand, 6)}
  </g>`;
  designs.push({
    id: 'pas-d-heure',
    name: 'Jusqu’à pas d’heure',
    tee: '#34322F',
    dark: true,
    pitch: "La suite du Crew : « jusqu'à pas d'heure » en gothique, bombé au pochoir avec ses coulures. Pour ta bande, celle des nuits qui finissent tard.",
    tech: 'Sérigraphie 1 couleur (sable) avec trame bombe · ou DTF',
    front: { w: 360, h: 260, cm: 8.5, svg: front },
    back: { w: 1000, h: 1200, cm: 30, top: 4, svg: back },
  });
}

// 4. CEUX QUE J'AIME > — une page de carnet, écrite à la main
{
  const gt = hand([[132, 555], [300, 632], [140, 712]], { amp: 6, step: 20, seed: 11 });
  const gt2 = hand([[150, 570], [288, 632], [156, 700]], { amp: 6, step: 24, seed: 12 });
  const arrow = hand([[742, 205], [770, 170], [778, 128], [758, 96]], { amp: 2, step: 12, seed: 4 });
  const ah = hand([[742, 114], [757, 94], [779, 106]], { amp: 1.5, step: 10, seed: 5 });
  const smallHeart = (x, y, s, seed) => hand(sample(heartPt(x, y, s), 22, 0, Math.PI * 2), { amp: s * 0.9, step: 9, seed, closed: true });
  const star = (cx, cy, r, seed) => {
    const p = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    return hand(p, { amp: 2.5, step: 10, seed });
  };
  const back = `
  <g fill="${C.ink}" font-family="Caveat" font-weight="700">
    <text x="480" y="360" text-anchor="middle" font-size="172" transform="rotate(-3 480 360)">ceux que j’aime</text>
    <text x="335" y="700" font-size="150" transform="rotate(1 335 700)">tout le reste</text>
  </g>
  <g fill="none" stroke="${C.brand}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${gt}" stroke-width="24"/>
    <path d="${gt2}" stroke-width="10" opacity=".9"/>
    <path d="${arrow}" stroke-width="7"/><path d="${ah}" stroke-width="7"/>
    <path d="${smallHeart(178, 120, 4.4, 21)}" stroke-width="7"/>
  </g>
  <text x="700" y="90" font-family="Caveat" font-weight="700" font-size="58" fill="${C.brand}" transform="rotate(-6 700 90)">(toi aussi)</text>
  <g fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="${star(905, 515, 40, 31)}"/><path d="${star(140, 890, 28, 32)}"/>
    <path d="${hand([[66, 465], [114, 465]], { amp: 2, seed: 2 })}"/><path d="${hand([[90, 441], [90, 489]], { amp: 2, seed: 3 })}"/>
  </g>
  ${mono(720, 900, 92, C.ink, C.ink, 3)}
  <path d="${hand([[640, 958], [700, 958]], { amp: 2, seed: 8 })}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
  const front = `
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="${smallHeart(170, 150, 7.2, 41)}" stroke="${C.brand}" stroke-width="9"/>
    <path d="${hand([[40, 250], [300, 60]], { amp: 2, step: 20, seed: 6 })}" stroke="${C.ink}" stroke-width="7"/>
    <path d="${hand([[300, 60], [262, 64]], { amp: 1, seed: 7 })}M300 60L292 96" stroke="${C.ink}" stroke-width="7"/>
    <path d="${hand([[40, 250], [52, 222]], { amp: 1, seed: 9 })}M40 250L70 246" stroke="${C.ink}" stroke-width="7"/>
  </g>
  <text x="195" y="300" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="50" fill="${C.ink}" transform="rotate(-4 195 300)">pour toi</text>`;
  designs.push({
    id: 'ceux-que-j-aime',
    name: 'Ceux que j’aime >',
    tee: '#F0EADC',
    dark: false,
    pitch: '« Love over everything », dit à la française et écrit à la main : ceux que j’aime > tout le reste. Avec un petit « (toi aussi) » pour celle ou celui qui le lit.',
    tech: 'Sérigraphie 2 couleurs (noir + framboise) · broderie possible devant',
    front: { w: 360, h: 330, cm: 9, svg: front },
    back: { w: 1000, h: 1020, cm: 30, top: 5, svg: back },
  });
}

// 5. LOVE CLUB — un tampon de club, avec une ligne pour écrire son numéro de membre
{
  const ring = 'LOVE OVER EVERYTHING ✶ LOVE CLUB ✶ DIMENSION ✶ ';
  const back = `
  <defs>
    ${wornFilter('lc-worn', 5, 1)}
    <path id="lc-ring" d="M500 500m-352 0a352 352 0 1 1 704 0a352 352 0 1 1 -704 0"/>
  </defs>
  <g filter="url(#lc-worn)" fill="${C.brand}" stroke="${C.brand}">
    <circle cx="500" cy="500" r="452" fill="none" stroke-width="16"/>
    <circle cx="500" cy="500" r="424" fill="none" stroke-width="4"/>
    <circle cx="500" cy="500" r="292" fill="none" stroke-width="6"/>
    <text font-family="Unbounded" font-weight="800" font-size="44" stroke="none"><textPath href="#lc-ring" textLength="2205" lengthAdjust="spacing">${ring}</textPath></text>
    <g stroke="none">${mono(415, 250, 175, C.brand, C.brand, 5)}</g>
    <text x="500" y="572" text-anchor="middle" font-family="Pirata One" font-size="150" stroke="none">love club</text>
    <text x="500" y="676" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="27" stroke="none" letter-spacing="3">MEMBRE N°</text>
    <path d="M380 726L620 726" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>
    ${sparkle(208, 500, 20, C.brand)}${sparkle(792, 500, 20, C.brand)}
  </g>`;
  const front = `
  <defs>${wornFilter('lc-wf', 8, 0.8)}</defs>
  <g filter="url(#lc-wf)" fill="${C.brand}">
    <text x="180" y="150" text-anchor="middle" font-family="Pirata One" font-size="118">love club</text>
    ${sparkle(180, 205, 16, C.brand)}
  </g>`;
  designs.push({
    id: 'love-club',
    name: 'Love Club',
    tee: '#F7F6F2',
    dark: false,
    pitch: 'Le tampon officiel du club : d°, « love club », et une ligne vide « membre n° » à remplir au feutre textile. Chaque t-shirt devient unique.',
    tech: 'Sérigraphie 1 couleur (framboise), effet tampon usé',
    front: { w: 360, h: 240, cm: 9, svg: front },
    back: { w: 1000, h: 1000, cm: 30, top: 6, svg: back },
  });
}

// 6. BARBELÉ — cœur en fil barbelé chromé, esprit an 2000
{
  const pts = sample(heartPt(500, 470, 23), 900, 0, Math.PI * 2);
  // deux brins torsadés autour du tracé
  let len = 0;
  const strand = (sign) =>
    hand(
      pts.map((p, i) => {
        if (i) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
        const q = pts[Math.min(i + 1, pts.length - 1)];
        const o = pts[Math.max(i - 1, 0)];
        const a = Math.atan2(q[1] - o[1], q[0] - o[0]);
        const k = sign * 6 * Math.sin(len / 13);
        return [p[0] - k * Math.sin(a), p[1] + k * Math.cos(a)];
      }),
      { amp: 0, step: 2 },
    );
  const s1 = strand(1);
  len = 0;
  const s2 = strand(-1);
  const wire = s1 + s2;
  let acc = 0;
  let barbs = '';
  let knots = '';
  const r = rng(77);
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc < 70) continue;
    acc = 0;
    const [x, y] = pts[i];
    const a = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    const L = 28 + r() * 6;
    const seg = (ang) => `M${f(x - L * Math.cos(ang))} ${f(y - L * Math.sin(ang))}L${f(x + L * Math.cos(ang))} ${f(y + L * Math.sin(ang))}`;
    barbs += seg(a + 0.7) + seg(a - 0.7);
    knots += `M${f(x - 4 * Math.cos(a))} ${f(y - 4 * Math.sin(a))}L${f(x + 4 * Math.cos(a))} ${f(y + 4 * Math.sin(a))}`;
  }
  const chrome = `
    <linearGradient id="bw-chrome" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="#cfd5dc"/><stop offset=".43" stop-color="#5b6169"/><stop offset=".5" stop-color="#1d2026"/>
      <stop offset=".54" stop-color="#e9edf2"/><stop offset=".72" stop-color="#8d949d"/><stop offset=".9" stop-color="#f4f6f8"/><stop offset="1" stop-color="#aab1ba"/>
    </linearGradient>
    <linearGradient id="bw-steel" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="900">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#a7aeb7"/><stop offset=".5" stop-color="#eef1f4"/><stop offset=".7" stop-color="#6e757e"/><stop offset="1" stop-color="#e3e7eb"/>
    </linearGradient>`;
  const back = `
  <defs>${chrome}</defs>
  <path d="${s1}" fill="none" stroke="#000" stroke-width="15"/><path d="${s1}" fill="none" stroke="url(#bw-steel)" stroke-width="8"/>
  <path d="${s2}" fill="none" stroke="#000" stroke-width="15"/><path d="${s2}" fill="none" stroke="url(#bw-steel)" stroke-width="8"/>
  <path d="${barbs}" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round"/>
  <path d="${barbs}" fill="none" stroke="url(#bw-steel)" stroke-width="5.5" stroke-linecap="round"/>
  <path d="${knots}" fill="none" stroke="#000" stroke-width="16" stroke-linecap="round"/>
  <path d="${knots}" fill="none" stroke="url(#bw-steel)" stroke-width="9" stroke-linecap="round"/>
  <g stroke="#000" stroke-width="10" stroke-linejoin="round" paint-order="stroke">
    <g transform="translate(372 300) scale(2.55)"><path d="${MONO_BOWL}" fill="url(#bw-chrome)" fill-rule="evenodd" stroke-width="3.6"/><path d="${MONO_STEM}" fill="url(#bw-chrome)" stroke-width="3.6"/></g>
  </g>
  <circle cx="${372 + 98 * 2.55}" cy="${300 + 7 * 2.55}" r="${4.2 * 2.55}" fill="none" stroke="#fff" stroke-width="4"/>
  ${sparkle(258, 196, 26, '#fff')}${sparkle(744, 690, 20, '#fff')}${sparkle(790, 168, 12, '#fff')}
  <text x="500" y="1010" text-anchor="middle" font-family="Pirata One" font-size="118" fill="url(#bw-chrome)" stroke="#000" stroke-width="7" paint-order="stroke">love over everything</text>`;
  const front = `
  <defs>${chrome}</defs>
  <g stroke="#000" stroke-width="5" paint-order="stroke">
    <text x="180" y="120" text-anchor="middle" font-family="Pirata One" font-size="104" fill="url(#bw-chrome)">dimension</text>
  </g>
  ${sparkle(330, 52, 12, '#fff')}`;
  designs.push({
    id: 'barbele',
    name: 'Barbelé',
    tee: '#121212',
    dark: true,
    pitch: 'Un cœur en fil barbelé chromé autour du d° : l’amour qui protège, esprit an 2000. Dessous, « love over everything » en gothique chrome.',
    tech: 'Impression DTG / DTF (dégradés chromés) · ou sérigraphie en trame',
    front: { w: 360, h: 160, cm: 10, svg: front },
    back: { w: 1000, h: 1060, cm: 31, top: 5, svg: back },
  });
}

// ── maquette de t-shirt (boxy, épaules tombées) ─────────────────────────────
const BODY =
  'M372 70C330 76 270 86 222 100C168 160 100 262 40 340L176 420L188 404C188 600 186 760 184 930Q500 942 816 930C814 760 812 600 812 404L824 420L960 340C900 262 832 160 778 100C730 86 670 76 628 70';
const NECK_FRONT = 'C590 146 410 146 372 70Z';
const NECK_BACK = 'Q500 92 372 70Z';

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k))));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}

function tee(d, side, printUrl, uid) {
  const front = side === 'front';
  const dk = d.dark;
  const shapePath = BODY + (front ? NECK_FRONT : NECK_BACK);
  const p = d[side];
  const w = p.cm * CM;
  const h = (w * p.h) / p.w;
  // devant : côté cœur (à droite quand on regarde le t-shirt) ; dos : centré sous le col
  const x = front ? 610 - w / 2 : 500 - w / 2;
  const y = front ? 236 - h / 2 : 136 + (p.top ?? 6) * CM;
  return `
  <g>
    <defs>
      <clipPath id="${uid}-clip"><path d="${shapePath}"/></clipPath>
      <linearGradient id="${uid}-side" x1="0" x2="1">
        <stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".22" stop-color="#000" stop-opacity="0"/>
        <stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/>
      </linearGradient>
      <radialGradient id="${uid}-light" cx=".46" cy=".34" r=".6"><stop offset="0" stop-color="#fff" stop-opacity="${dk ? 0.07 : 0.22}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <filter id="${uid}-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="${uid}-knit" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.6 0.9" numOctaves="2" seed="4" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 ${dk ? 1 : 0} 0 0 0 0 ${dk ? 1 : 0} 0 0 0 0 ${dk ? 1 : 0} 0 0 0 ${dk ? 0.16 : 0.12} 0" result="t"/>
        <feComposite in="t" in2="SourceGraphic" operator="in"/>
      </filter>
      <filter id="${uid}-ink" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="9" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.55 1.3" result="a"/>
        <feComposite in="SourceGraphic" in2="a" operator="in"/>
      </filter>
    </defs>
    <path d="${shapePath}" fill="#000" opacity=".16" transform="translate(6 14)" filter="url(#${uid}-blur)"/>
    <path d="${shapePath}" fill="${d.tee}"/>
    <g clip-path="url(#${uid}-clip)">
      ${front ? `<path d="M372 70Q500 52 628 70C590 146 410 146 372 70Z" fill="${shade(d.tee, -0.3)}"/>` : ''}
      <image href="${printUrl}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" filter="url(#${uid}-ink)" opacity="${dk ? 0.96 : 0.97}"/>
      <rect width="1000" height="1100" fill="url(#${uid}-side)"/>
      <rect width="1000" height="1100" fill="url(#${uid}-light)"/>
      <g fill="#000" filter="url(#${uid}-blur)" opacity="${dk ? 0.22 : 0.09}">
        <path d="M188 410C246 456 282 540 282 660L230 930L184 930Z"/>
        <path d="M812 410C754 456 718 540 718 660L770 930L816 930Z"/>
        <ellipse cx="420" cy="770" rx="34" ry="150" transform="rotate(-8 420 770)" opacity=".45"/>
        <ellipse cx="640" cy="690" rx="30" ry="130" transform="rotate(10 640 690)" opacity=".35"/>
        <path d="M48 340L176 420L222 100C176 166 110 262 48 340Z" opacity=".35"/>
        <path d="M952 340L824 420L778 100C824 166 890 262 952 340Z" opacity=".35"/>
      </g>
      <rect width="1000" height="1100" filter="url(#${uid}-knit)"/>
      <g fill="none" stroke="${dk ? '#fff' : '#000'}" stroke-opacity="${dk ? 0.1 : 0.12}" stroke-width="2">
        <path d="M222 100C206 220 194 320 188 404"/><path d="M778 100C794 220 806 320 812 404"/>
        <path d="M186 910Q500 922 814 910" stroke-dasharray="7 6"/>
        <path d="M52 328L182 400" stroke-dasharray="7 6"/><path d="M948 328L818 400" stroke-dasharray="7 6"/>
      </g>
      <path d="${front ? 'M372 70C410 146 590 146 628 70' : 'M372 70Q500 92 628 70'}" fill="none" stroke="${shade(d.tee, dk ? 0.08 : -0.1)}" stroke-width="22"/>
      <path d="${front ? 'M382 84C418 140 582 140 618 84' : 'M378 82Q500 104 622 82'}" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="2"/>
    </g>
    <path d="${shapePath}" fill="none" stroke="#000" stroke-opacity="${dk ? 0.5 : 0.14}" stroke-width="2"/>
  </g>`;
}

// ── rendu ───────────────────────────────────────────────────────────────────
const page = (body, bg = 'transparent') =>
  `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}"><style>html,body{margin:0;background:${bg}}svg{display:block}</style></head><body>${body}</body></html>`;

(async () => {
  const only = process.argv[2];
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const list = designs.filter((d) => !only || d.id === only);
  const boards = [];

  for (const d of list) {
    const prints = {};
    for (const side of ['front', 'back']) {
      const p = d[side];
      // fichier d'impression : 300 dpi à la taille réelle
      const px = Math.round((p.cm / 2.54) * 300);
      const ctx = await b.newContext({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: px / p.w });
      const pg = await ctx.newPage();
      await pg.setContent(page(`<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}">${p.svg}</svg>`), { waitUntil: 'networkidle' });
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForTimeout(150);
      const file = path.join(OUT, `${d.id}-${side}.png`);
      await pg.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: p.w, height: p.h } });
      prints[side] = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
      await ctx.close();
      console.log(`${d.id}-${side}.png  ${px} px (${p.cm} cm à 300 dpi)`);
    }

    // planche : devant + dos sur fond gris studio, avec le nom et la technique conseillée
    const W = 2200;
    const H = 1400;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#D9D8DA"/>
      <g transform="translate(60 230) scale(1.06)">${tee(d, 'front', prints.front, d.id + 'f')}</g>
      <g transform="translate(1080 230) scale(1.06)">${tee(d, 'back', prints.back, d.id + 'b')}</g>
      <text x="80" y="92" font-family="Unbounded" font-weight="800" font-size="46" fill="#151515">${d.name}</text>
      <text x="${W - 80}" y="92" text-anchor="end" font-family="JetBrains Mono" font-weight="600" font-size="22" fill="#5b5a5e" letter-spacing="2">DROP 02 · PROPOSITION · ${d.id.toUpperCase()}</text>
      <text x="580" y="1330" text-anchor="middle" font-family="JetBrains Mono" font-weight="600" font-size="22" fill="#5b5a5e" letter-spacing="4">DEVANT</text>
      <text x="1620" y="1330" text-anchor="middle" font-family="JetBrains Mono" font-weight="600" font-size="22" fill="#5b5a5e" letter-spacing="4">DOS</text>
    </svg>`;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.setContent(page(svg, '#D9D8DA'), { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(200);
    const file = path.join(OUT, `${d.id}-maquette.jpg`);
    await pg.screenshot({ path: file, type: 'jpeg', quality: 90 });
    boards.push({ d, prints });
    await ctx.close();
    console.log(`${d.id}-maquette.jpg`);
  }

  // planche d'ensemble : tous les dos, trois par ligne
  if (!only) {
    const cols = 3;
    const cw = 1000;
    const ch = 1160;
    const W = cols * cw + 160;
    const H = Math.ceil(boards.length / cols) * ch + 260;
    const cells = boards
      .map(({ d, prints }, i) => {
        const x = 80 + (i % cols) * cw;
        const y = 220 + Math.floor(i / cols) * ch;
        return `<g transform="translate(${x + 40} ${y}) scale(0.92)">${tee(d, 'back', prints.back, d.id + 'o')}</g>
          <text x="${x + cw / 2}" y="${y + 950}" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="40" fill="#151515">${d.name}</text>
          <text x="${x + cw / 2}" y="${y + 1000}" text-anchor="middle" font-family="JetBrains Mono" font-weight="600" font-size="22" fill="#5b5a5e" letter-spacing="2">${String(i + 1).padStart(2, '0')} · ${d.tech.split(' · ')[0].toUpperCase()}</text>`;
      })
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#D9D8DA"/>
      <text x="80" y="130" font-family="Unbounded" font-weight="800" font-size="72" fill="#151515">dimension. — Drop 02</text>
      <text x="${W - 80}" y="130" text-anchor="end" font-family="JetBrains Mono" font-weight="600" font-size="26" fill="#5b5a5e" letter-spacing="3">PROPOSITIONS · DOS</text>
      ${cells}
    </svg>`;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.setContent(page(svg, '#D9D8DA'), { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(OUT, '00-planche-drop-02.jpg'), type: 'jpeg', quality: 90 });
    await ctx.close();
    console.log('00-planche-drop-02.jpg');
  }
  await b.close();
})();
