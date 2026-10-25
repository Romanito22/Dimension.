// Monogramme « d° » redessiné en vectoriel (viewBox 0 0 104 100).
// Remplacé automatiquement par /public/brand/monogram.svg s'il existe.
export const MONO_VIEWBOX = '0 0 104 100';
export const MONO_BOWL =
  'M10 66a28 28 0 1 0 56 0a28 28 0 1 0 -56 0Z M23 64a14 14 0 1 0 28 0a14 14 0 1 0 -28 0Z';
export const MONO_STEM =
  'M54 34C54 15 66 5 80 6C93 7 99 19 95 30C93 36 87 40 81 38C87 33 88 24 83 18C77 12 68 16 68 32L68 88Q68 97 61 97Q54 97 54 88Z';
export const MONO_RING = { cx: 98, cy: 7, r: 4.2 };

export function monogramSvg(fill = 'currentColor', ringStroke = fill, extra = '') {
  return `<path d="${MONO_BOWL}" fill="${fill}" fill-rule="evenodd" ${extra}/><path d="${MONO_STEM}" fill="${fill}" ${extra}/><circle cx="${MONO_RING.cx}" cy="${MONO_RING.cy}" r="${MONO_RING.r}" fill="none" stroke="${ringStroke}" stroke-width="1.4"/>`;
}
