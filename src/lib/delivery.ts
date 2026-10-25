// Estimation de la date de livraison (jours ouvrés, préparation sous 24 h, envoi avant 14 h).
const fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

function addBusinessDays(from: Date, n: number) {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export function deliveryWindow(minDays: number, maxDays: number, now = new Date()) {
  const start = new Date(now);
  const day = start.getDay();
  const late = now.getHours() >= 14 || day === 0 || day === 6;
  const ship = late ? 1 : 0;
  return {
    from: fmt.format(addBusinessDays(start, minDays + ship)),
    to: fmt.format(addBusinessDays(start, maxDays + ship)),
    cutoff: !late,
  };
}
