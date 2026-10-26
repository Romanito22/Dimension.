// Estimation de la date de livraison (jours ouvrés hors jours fériés français,
// préparation sous 24 h, envoi le jour même avant 14 h).
import { intlLocale, type Locale } from '../i18n';

const fmt = (locale: Locale) => new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', day: 'numeric', month: 'short' });

const key = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Dimanche de Pâques (algorithme de Meeus). */
function easter(y: number) {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  return new Date(y, month - 1, ((h + l - 7 * m + 114) % 31) + 1);
}

const holidayCache = new Map<number, Set<string>>();
function holidays(y: number) {
  let set = holidayCache.get(y);
  if (set) return set;
  const e = easter(y);
  const shift = (n: number) => new Date(y, e.getMonth(), e.getDate() + n);
  set = new Set(
    [
      new Date(y, 0, 1),
      shift(1), // lundi de Pâques
      new Date(y, 4, 1),
      new Date(y, 4, 8),
      shift(39), // Ascension
      shift(50), // lundi de Pentecôte
      new Date(y, 6, 14),
      new Date(y, 7, 15),
      new Date(y, 10, 1),
      new Date(y, 10, 11),
      new Date(y, 11, 25),
    ].map(key),
  );
  holidayCache.set(y, set);
  return set;
}

export const isBusinessDay = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6 && !holidays(d.getFullYear()).has(key(d));

export function addBusinessDays(from: Date, n: number) {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDay(d)) added++;
  }
  return d;
}

/** Jours ouvrés entre l'expédition et la livraison, par mode (min, max). */
export const SHIP_DAYS: Record<string, [number, number]> = { relay: [3, 5], home: [2, 3], express: [1, 1] };

export function deliveryWindow(minDays: number, maxDays: number, now = new Date(), locale: Locale = 'fr') {
  const late = now.getHours() >= 14 || !isBusinessDay(now);
  const ship = late ? 1 : 0;
  return {
    from: fmt(locale).format(addBusinessDays(now, minDays + ship)),
    to: fmt(locale).format(addBusinessDays(now, maxDays + ship)),
    cutoff: !late,
  };
}
