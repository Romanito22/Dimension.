// Visuels provisoires générés en SVG : chaque pièce est redessinée (coupe, couleur,
// print devant / dos) sur fond studio gris ou sur gravier, comme les vraies photos.
// Dès qu'un fichier existe dans /public/images/<clé>.(jpg|webp|png), il le remplace.
import products from '../data/products.json';
import { monogramSvg } from './logo';

type Product = (typeof products)[number];
type View = 'front' | 'back';
type Bg = 'studio' | 'gravel' | 'cotton';

const FRAMBOISE = '#A3174D';
const CANDY = '#F2A2CC';

export interface Spec {
  w: number;
  h: number;
  ratio: string;
  size: string;
  alt: string;
  render: () => string;
}

/* ---------- utilitaires ---------- */
let uid = 0;
const id = (p: string) => `${p}${++uid}`;

function mix(hex: string, to: string, t: number) {
  const a = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16));
  const b = to.match(/\w\w/g)!.map((x) => parseInt(x, 16));
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function luminance(hex: string) {
  const [r, g, b] = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- formes de vêtements (espace 400 × 500) ---------- */
const TEE = {
  d: 'M148 112Q200 140 252 112L318 132Q330 136 334 148L362 236L314 252L299 214L300 410Q300 418 292 418L108 418Q100 418 100 410L101 214L86 252L38 236L66 148Q70 136 82 132Z',
  collar: { front: ['M148 112Q200 140 252 112', 'M157 115Q200 152 243 115'], back: ['M148 112Q200 124 252 112', 'M156 115Q200 134 244 115'] },
  stitches: 'M104 404L296 404M44 228L88 243M356 228L312 243',
  seams: 'M84 133L102 214M316 133L298 214',
};
const SWEATER = {
  d: 'M150 112Q200 136 250 112L316 128Q332 134 338 150L370 360Q372 372 360 374L332 378Q322 380 320 370L300 236L300 410L100 410L100 236L80 370Q78 380 68 378L40 374Q28 372 30 360L62 150Q68 134 84 128Z',
  collar: { front: ['M150 112Q200 136 250 112', 'M160 117Q200 150 240 117'], back: ['M150 112Q200 122 250 112', 'M158 116Q200 132 242 116'] },
  stitches: '',
  seams: 'M84 129L100 236M316 129L300 236',
};

/* ---------- prints ---------- */
const ART_FOCUS: Record<string, [number, number]> = {
  love: [200, 182],
  crew: [242, 174],
  splash: [200, 190],
  doodle: [212, 222],
  camo: [246, 212],
};

function artLove(view: View) {
  if (view === 'front') {
    return `<g transform="translate(184 166) scale(.32)">${monogramSvg(FRAMBOISE, FRAMBOISE, 'stroke="#1a1a1a" stroke-width="3.5" paint-order="stroke"')}</g>`;
  }
  const heart =
    'M200 322C142 304 94 266 96 214C98 180 126 160 156 166C178 170 192 184 200 198C208 184 222 170 244 166C274 160 302 180 304 214C306 266 258 304 200 322Z';
  const wob = id('w');
  return `<filter id="${wob}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>
  <path d="${heart}" fill="${CANDY}" stroke="${FRAMBOISE}" stroke-width="16" stroke-linejoin="round" paint-order="stroke"/>
  <g filter="url(#${wob})"><text x="201" y="262" text-anchor="middle" transform="rotate(-5 200 240)" font-family="'Arial Black', 'Arial Rounded MT Bold', Helvetica, sans-serif" font-weight="900" font-size="66" letter-spacing="-4" fill="#F9CFE4" stroke="${FRAMBOISE}" stroke-width="8" stroke-linejoin="round" paint-order="stroke">LOVE</text></g>
  <text x="200" y="362" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12.5" letter-spacing="4" fill="${FRAMBOISE}">OVER EVERYTHING</text>`;
}

function artCrew(view: View, garmentHex: string) {
  if (view === 'front') {
    return `<text x="242" y="178" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="13" letter-spacing=".6" fill="#5b5754">DIMENSI*N</text>`;
  }
  const ink = '#4b4846';
  const b = id('b');
  return `<filter id="${b}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
  <g filter="url(#${b})" opacity=".55"><ellipse cx="206" cy="262" rx="92" ry="100" fill="${ink}"/></g>
  <g fill="${ink}">
    <circle cx="158" cy="180" r="13"/><path d="M146 172L176 170L182 176L150 178Z"/>
    <path d="M138 196L180 196L188 292L178 362L160 364L158 304L150 364L132 362L134 292Z"/>
    <circle cx="214" cy="172" r="11"/>
    <path d="M198 186L232 186L237 264L228 334L215 334L212 284L206 334L193 334L195 264Z"/>
    <circle cx="262" cy="176" r="10"/>
    <path d="M250 189L276 189L280 246L268 262L252 252Z"/>
  </g>
  <g fill="none" stroke="${ink}" stroke-width="4"><circle cx="252" cy="300" r="17"/><circle cx="282" cy="294" r="17"/><path d="M252 300L266 262L282 294M262 276L278 272"/></g>
  <text x="159" y="238" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="11" fill="${garmentHex}">DIMENSION</text>
  <text x="122" y="214" font-family="Arial, sans-serif" font-weight="700" font-size="40" fill="${ink}">*</text>`;
}

function artSplash(view: View) {
  const ink = '#F2F1EE';
  if (view === 'front') {
    return `<text x="200" y="196" text-anchor="middle" font-family="'Trebuchet MS', Arial, sans-serif" font-weight="700" font-size="27" letter-spacing="-.5" fill="${ink}">dimension</text>`;
  }
  return `<g fill="${ink}">
    <path d="M118 262C106 224 146 204 168 178C190 152 242 140 272 158C302 174 312 204 292 224C276 240 252 232 238 250C224 268 202 262 186 282C170 300 128 298 118 262Z"/>
    <path d="M132 198L114 148L144 192ZM170 170L174 126L186 166ZM226 150L254 124L240 160ZM292 182L320 170L298 196ZM110 250L86 262L112 262Z"/>
    <ellipse cx="128" cy="290" rx="5" ry="9"/><ellipse cx="150" cy="300" rx="3" ry="6"/><ellipse cx="300" cy="238" rx="4" ry="7"/>
  </g>
  <ellipse cx="214" cy="262" rx="48" ry="16" fill="#151515" stroke="${ink}" stroke-width="4"/>
  <text x="214" y="266.5" text-anchor="middle" font-family="'Trebuchet MS', Arial, sans-serif" font-weight="700" font-size="12" fill="${ink}">dimension</text>
  <circle cx="224" cy="284" r="6.5" fill="${ink}"/>`;
}

function artDoodle(view: View) {
  if (view === 'back') return '';
  return `<g fill="none" stroke="#151515" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M168 150L176 160L190 158L182 170L188 182L174 176L162 184L164 170L154 162L166 162Z"/>
    <path d="M200 166C188 190 194 214 206 210C216 206 214 184 206 172"/>
    <path d="M226 172L240 184M240 170L226 186"/>
    <path d="M254 176L240 228M262 178L248 230M270 182L256 232M278 186L264 234"/>
    <path d="M148 196L172 192L178 226L156 230ZM150 204L172 200M152 213L174 209"/>
    <path d="M172 232C166 262 182 292 216 296C238 298 250 288 254 278"/>
    <path d="M182 254L204 246M194 244L190 260"/>
    <path d="M226 264C224 246 240 240 238 258C236 270 226 276 244 278C252 279 256 268 262 270C268 272 266 282 274 281"/>
  </g>
  <text x="246" y="306" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="7.5" letter-spacing="2.6" fill="#151515">DIMENSION</text>`;
}

function artCamo(view: View, clip: string) {
  const r = rng(view === 'front' ? 11 : 29);
  let strokes = '';
  for (let i = 0; i < 46; i++) {
    const x = 30 + r() * 340;
    const y = 110 + r() * 300;
    const c = r() > 0.5 ? '#8E8F93' : '#CBC5BA';
    const w = 10 + r() * 14;
    const dx = 30 + r() * 50;
    const dy = (r() - 0.5) * 40;
    strokes += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(dx / 2).toFixed(1)} ${(dy - 18).toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}t${(dx * 0.7).toFixed(1)} ${(r() * 20 - 10).toFixed(1)}" stroke="${c}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" fill="none"/>`;
  }
  const rib = '#1b1b1b';
  const word =
    view === 'front'
      ? `<text x="246" y="216" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="16" letter-spacing=".5" fill="#fff">DIMENSI*N</text>`
      : '';
  return `<g clip-path="url(#${clip})">${strokes}
    <rect x="96" y="388" width="208" height="24" fill="${rib}"/>
    <path d="M28 352L72 360L68 380L28 374ZM372 352L328 360L332 380L372 374Z" fill="${rib}"/>
  </g>${word}`;
}

/* ---------- vêtement complet ---------- */
function garment(p: Product, view: View) {
  const isKnit = p.art === 'camo';
  const shape = isKnit ? SWEATER : TEE;
  const base = isKnit ? '#1d1d1d' : p.colors[0].hex;
  const dark = luminance(base) < 0.25;
  const line = dark ? mix(base, '#ffffff', 0.18) : mix(base, '#000000', 0.16);
  const clip = id('c');
  const vol = id('v');
  const [c1, c2] = shape.collar[view];
  let art = '';
  if (p.art === 'love') art = artLove(view);
  if (p.art === 'crew') art = artCrew(view, base);
  if (p.art === 'splash') art = artSplash(view);
  if (p.art === 'doodle') art = artDoodle(view);
  if (p.art === 'camo') art = artCamo(view, clip);

  const fold = id('f');
  const knit = id('k');
  const ao = id('ao');
  const seed = (p.id.charCodeAt(6) * 7 + (view === 'back' ? 13 : 0)) % 97;
  return `<defs>
    <clipPath id="${clip}"><path d="${shape.d}"/></clipPath>
    <linearGradient id="${vol}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.1 : 0.22}"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
    <filter id="${fold}" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="500" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.0085 0.0042" numOctaves="2" seed="${seed}" result="n0"/>
      <feGaussianBlur in="n0" stdDeviation="2.5" result="n"/>
      <feDiffuseLighting in="n" result="light" surfaceScale="${dark ? 16 : 13}" diffuseConstant="1.08" lighting-color="#fff"><feDistantLight azimuth="235" elevation="62"/></feDiffuseLighting>
      <feBlend in="SourceGraphic" in2="light" mode="multiply" result="shaded"/>
      <feSpecularLighting in="n" surfaceScale="${dark ? 16 : 13}" specularConstant="${dark ? 0.22 : 0.12}" specularExponent="18" lighting-color="#fff" result="spec"><feDistantLight azimuth="235" elevation="62"/></feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
      <feComposite in="specIn" in2="shaded" operator="arithmetic" k2="1" k3="1"/>
      <feComposite in2="SourceAlpha" operator="in"/>
    </filter>
    <filter id="${knit}" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="500">
      <feTurbulence type="fractalNoise" baseFrequency="0.9 1.6" numOctaves="1" seed="${seed + 3}"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 .78"/>
    </filter>
    <filter id="${ao}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <g filter="url(#${fold})">
    <path d="${shape.d}" fill="${base}"/>
    ${art}
  </g>
  <g clip-path="url(#${clip})">
    <rect x="0" y="0" width="400" height="500" fill="url(#${vol})"/>
    <rect x="0" y="0" width="400" height="500" filter="url(#${knit})" opacity="${dark ? 0.1 : 0.07}"/>
    <path d="${shape.d}" fill="none" stroke="#000" stroke-width="22" opacity="${dark ? 0.35 : 0.13}" filter="url(#${ao})"/>
  </g>
  <g fill="none" stroke="${line}" stroke-linecap="round">
    <path d="${c1}" stroke-width="2"/><path d="${c2}" stroke-width="2"/>
    <path d="${shape.seams}" stroke-width="1.4" opacity=".7"/>
    <path d="${shape.stitches}" stroke-width="1.2" stroke-dasharray="3 3" opacity=".8"/>
  </g>`;
}

/* ---------- fonds ---------- */
function background(kind: Bg, w: number, h: number, seed = 3) {
  if (kind === 'studio') {
    const g = id('st');
    return `<defs><radialGradient id="${g}" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#DEDBDA"/><stop offset="1" stop-color="#C6C3C2"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#${g})"/>`;
  }
  if (kind === 'cotton') {
    const f = id('ct');
    return `<defs><filter id="${f}"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="${seed}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 .9"/></filter></defs>
    <rect width="${w}" height="${h}" fill="#F7F6F3"/><rect width="${w}" height="${h}" filter="url(#${f})" opacity=".35"/>`;
  }
  const a = id('ga');
  const b = id('gb');
  const c = id('gc');
  const sun = id('sun');
  const rel = id('rel');
  return `<defs>
    <filter id="${rel}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${(0.11).toFixed(3)}" numOctaves="3" seed="${seed + 5}" result="t"/><feDiffuseLighting in="t" surfaceScale="5" diffuseConstant="1.1" lighting-color="#ffe7c8"><feDistantLight azimuth="225" elevation="42"/></feDiffuseLighting><feColorMatrix values="0.44 0 0 0 0  0 0.34 0 0 0  0 0 0.27 0 0  0 0 0 1 0"/></filter>
    <filter id="${a}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 .84  0 0 0 0 .74  0 0 0 0 .64  5 0 0 0 -2.95"/></filter>
    <filter id="${b}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="${seed + 9}"/><feColorMatrix values="0 0 0 0 .13  0 0 0 0 .10  0 0 0 0 .08  4 0 0 0 -2.1"/></filter>
    <filter id="${c}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="${seed + 21}"/><feColorMatrix values="0 0 0 0 .62  0 0 0 0 .40  0 0 0 0 .32  3.6 0 0 0 -2"/></filter>
    <linearGradient id="${sun}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3df" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#5C4A3D"/>
  <rect width="${w}" height="${h}" filter="url(#${rel})"/>
  <rect width="${w}" height="${h}" filter="url(#${c})" opacity=".7"/>
  <rect width="${w}" height="${h}" filter="url(#${b})"/>
  <rect width="${w}" height="${h}" filter="url(#${a})"/>
  <rect width="${w}" height="${h}" fill="url(#${sun})"/>`;
}

function shadowFilter(kind: Bg) {
  const s = id('sh');
  const op = kind === 'gravel' ? 0.45 : 0.16;
  return {
    id: s,
    def: `<defs><filter id="${s}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="${kind === 'gravel' ? 8 : 0}" dy="${kind === 'gravel' ? 12 : 14}" stdDeviation="${kind === 'gravel' ? 7 : 16}" flood-color="#000" flood-opacity="${op}"/></filter></defs>`,
  };
}

function place(content: string, cx: number, cy: number, scale: number, rotate = 0, filter = '') {
  return `<g transform="translate(${cx} ${cy}) rotate(${rotate}) scale(${scale}) translate(-200 -265)" ${filter ? `filter="url(#${filter})"` : ''}>${content}</g>`;
}

function label(w: number, h: number, kind: Bg, path: string) {
  const fs = Math.max(9, Math.round(Math.min(w, h) * 0.02));
  const color = kind === 'gravel' ? 'rgba(255,255,255,.78)' : 'rgba(23,21,20,.5)';
  const pad = Math.round(w * 0.035);
  return `<g font-family="Arial, Helvetica, sans-serif" font-size="${fs}" fill="${color}" letter-spacing=".5">
    <text x="${pad}" y="${h - pad}">VISUEL PROVISOIRE</text>
    <text x="${w - pad}" y="${h - pad}" text-anchor="end">${path}</text>
  </g>`;
}

function doc(w: number, h: number, body: string) {
  uid = 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}

interface Shot {
  product: Product;
  view: View;
  x: number; // centre relatif (0-1)
  y: number;
  s: number; // échelle relative à la hauteur
  r?: number;
}

function scene(w: number, h: number, kind: Bg, shots: Shot[], path: string, seed = 3) {
  return doc(
    w,
    h,
    (() => {
      let out = background(kind, w, h, seed);
      for (const sh of shots) {
        const f = shadowFilter(kind);
        out += f.def + place(garment(sh.product, sh.view), sh.x * w, sh.y * h, (sh.s * h) / 500, sh.r ?? 0, f.id);
      }
      return out + label(w, h, kind, path);
    })(),
  );
}

function detail(p: Product, path: string) {
  const w = 800;
  const h = 1000;
  const [fx, fy] = ART_FOCUS[p.art] ?? [200, 200];
  const z = 5.2;
  const body =
    background('studio', w, h) +
    `<g transform="translate(${w / 2} ${h / 2}) scale(${z}) translate(${-fx} ${-fy})">${garment(p, 'front')}</g>` +
    label(w, h, 'studio', path);
  return doc(w, h, body);
}

/* ---------- registre des visuels ---------- */
const P = (i: number) => products[i % products.length];
const hasBack = (p: Product) => p.art !== 'doodle';

export const SPECS: Record<string, Spec> = {};

function add(key: string, w: number, h: number, ratio: string, size: string, alt: string, render: (path: string) => string) {
  const path = `images/${key}.jpg`;
  SPECS[key] = { w, h, ratio, size, alt, render: () => render(path) };
}

products.forEach((p, i) => {
  const k = `products/${p.id.toLowerCase()}`;
  add(`${k}-1`, 800, 1000, '4:5', '1600 × 2000', `${p.name} — vue de face`, (path) =>
    scene(800, 1000, 'studio', [{ product: p, view: 'front', x: 0.5, y: 0.5, s: 0.86 }], path),
  );
  add(`${k}-2`, 800, 1000, '4:5', '1600 × 2000', `${p.name} — vue de dos`, (path) =>
    scene(800, 1000, 'studio', [{ product: p, view: 'back', x: 0.5, y: 0.5, s: 0.86 }], path),
  );
  add(`${k}-3`, 800, 1000, '4:5', '1600 × 2000', `${p.name} — détail du print`, (path) => detail(p, path));
  add(`${k}-4`, 800, 1000, '4:5', '1600 × 2000', `${p.name} — à plat sur le gravier`, (path) =>
    scene(800, 1000, 'gravel', [{ product: p, view: hasBack(p) ? 'back' : 'front', x: 0.5, y: 0.5, s: 0.9, r: -12 + i * 5 }], path, 3 + i),
  );
});

add('hero/desktop', 1600, 900, '16:9', '2560 × 1440', 'T-shirt Love Over Everything posé sur le gravier en plein soleil', (path) =>
  scene(1600, 900, 'gravel', [{ product: P(0), view: 'back', x: 0.68, y: 0.52, s: 0.98, r: -9 }], path, 5),
);
add('hero/mobile', 800, 1000, '4:5', '1350 × 1688', 'T-shirt Love Over Everything posé sur le gravier', (path) =>
  scene(800, 1000, 'gravel', [{ product: P(0), view: 'back', x: 0.56, y: 0.34, s: 0.62, r: -9 }], path, 5),
);
add('categories/t-shirts', 900, 1200, '3:4', '1500 × 2000', 'Les t-shirts du Drop 01', (path) =>
  scene(900, 1200, 'studio', [
    { product: P(1), view: 'back', x: 0.36, y: 0.4, s: 0.55, r: -6 },
    { product: P(2), view: 'front', x: 0.64, y: 0.62, s: 0.55, r: 5 },
  ], path),
);
add('categories/maille', 900, 1200, '3:4', '1500 × 2000', 'Le pull Camo en maille', (path) =>
  scene(900, 1200, 'studio', [{ product: P(4), view: 'front', x: 0.5, y: 0.5, s: 0.7 }], path),
);
add('categories/love', 900, 1200, '3:4', '1500 × 2000', 'Le T-shirt Love Over Everything', (path) =>
  scene(900, 1200, 'gravel', [{ product: P(0), view: 'front', x: 0.5, y: 0.5, s: 0.72, r: 8 }], path, 8),
);
add('story/1', 800, 1000, '4:5', '1600 × 2000', 'Le monogramme brodé en gros plan', (path) =>
  doc(800, 1000, background('cotton', 800, 1000, 4) +
    `<g transform="translate(400 470) scale(4.4) translate(-52 -52)">${monogramSvg(FRAMBOISE, FRAMBOISE, 'stroke="#1a1a1a" stroke-width="2.6" paint-order="stroke"')}</g>` +
    label(800, 1000, 'cotton', path)),
);
add('story/2', 1600, 900, '16:9', '2560 × 1440', 'Les pièces du Drop 01 à plat au soleil', (path) =>
  scene(1600, 900, 'gravel', [
    { product: P(3), view: 'front', x: 0.24, y: 0.5, s: 0.82, r: -14 },
    { product: P(0), view: 'back', x: 0.52, y: 0.48, s: 0.82, r: 6 },
    { product: P(2), view: 'back', x: 0.8, y: 0.52, s: 0.82, r: -4 },
  ], path, 12),
);
add('story/3', 800, 1000, '4:5', '1600 × 2000', 'Détail de la maille jacquard', (path) => detail(P(4), path));

// Détourés (PNG transparent) : scène du hero et section « Devant / Dos »
products.forEach((p) => {
  (['front', 'back'] as View[]).forEach((view) => {
    add(`cutout/${p.id.toLowerCase()}-${view}`, 1000, 1250, '4:5', '2000 × 2500 (PNG détouré)', `${p.name} — ${view === 'front' ? 'devant' : 'dos'}, détouré`, () =>
      doc(1000, 1250, place(garment(p, view), 500, 640, 2.3)),
    );
  });
});

const LOOKS: { kind: Bg; ratio: '4:5' | '16:9'; shots: Omit<Shot, 'product'>[]; p: number[] }[] = [
  { kind: 'gravel', ratio: '16:9', p: [0], shots: [{ view: 'back', x: 0.5, y: 0.5, s: 0.95, r: 14 }] },
  { kind: 'studio', ratio: '4:5', p: [1], shots: [{ view: 'back', x: 0.5, y: 0.5, s: 0.84 }] },
  { kind: 'gravel', ratio: '4:5', p: [2], shots: [{ view: 'back', x: 0.5, y: 0.5, s: 0.86, r: -18 }] },
  { kind: 'studio', ratio: '4:5', p: [4], shots: [{ view: 'front', x: 0.5, y: 0.5, s: 0.84 }] },
  { kind: 'gravel', ratio: '16:9', p: [3, 1], shots: [{ view: 'front', x: 0.33, y: 0.5, s: 0.88, r: -8 }, { view: 'back', x: 0.68, y: 0.5, s: 0.88, r: 10 }] },
  { kind: 'studio', ratio: '4:5', p: [0], shots: [{ view: 'front', x: 0.5, y: 0.5, s: 0.84 }] },
  { kind: 'gravel', ratio: '4:5', p: [4], shots: [{ view: 'back', x: 0.5, y: 0.5, s: 0.82, r: 9 }] },
  { kind: 'studio', ratio: '4:5', p: [3], shots: [{ view: 'front', x: 0.5, y: 0.5, s: 0.84 }] },
  { kind: 'gravel', ratio: '16:9', p: [2, 0, 4], shots: [{ view: 'front', x: 0.2, y: 0.5, s: 0.78, r: 8 }, { view: 'back', x: 0.5, y: 0.5, s: 0.78, r: -6 }, { view: 'front', x: 0.8, y: 0.5, s: 0.78, r: 12 }] },
];
LOOKS.forEach((look, i) => {
  const [w, h] = look.ratio === '16:9' ? [1600, 900] : [800, 1000];
  add(`lookbook/${i + 1}`, w, h, look.ratio, look.ratio === '16:9' ? '2560 × 1440' : '1600 × 2000', `Lookbook Drop 01 — image ${i + 1}`, (path) =>
    scene(w, h, look.kind, look.shots.map((s, j) => ({ ...s, product: P(look.p[j]) })), path, 20 + i),
  );
});

for (let i = 0; i < 6; i++) {
  const p = P(i);
  add(`social/${i + 1}`, 600, 600, '1:1', '1080 × 1080', `Publication @dimensionbrand ${i + 1}`, (path) =>
    scene(600, 600, i % 2 ? 'studio' : 'gravel', [{ product: p, view: i % 3 === 0 && hasBack(p) ? 'back' : 'front', x: 0.5, y: 0.52, s: 0.86, r: i % 2 ? 0 : -10 + i * 4 }], path, 40 + i),
  );
}

export const placeholderKeys = () => Object.keys(SPECS);
export const encodeKey = (key: string) => key.replaceAll('/', '--');
export const decodeKey = (slug: string) => slug.replaceAll('--', '/');
