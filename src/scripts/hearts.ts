// Petite gerbe de cœurs à l'ajout au panier : love over everything, jusque dans le bouton.
import { reducedMotion } from './scroll';

const COLORS = ['#C2124F', '#FF7AA8', '#F9CFE4', '#111111'];

export function hearts(from: HTMLElement, count = 9) {
  if (reducedMotion) return;
  const r = from.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const h = document.createElement('span');
    h.className = 'heart-fx';
    h.textContent = '♥';
    h.style.left = `${x}px`;
    h.style.top = `${y}px`;
    h.style.color = COLORS[i % COLORS.length];
    h.style.fontSize = `${12 + Math.random() * 12}px`;
    document.body.append(h);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const dist = 50 + Math.random() * 70;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    h.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * 0.6}px), calc(-50% + ${dy * 0.6}px)) scale(1.1) rotate(${(Math.random() - 0.5) * 40}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 30}px)) scale(0.8)`, opacity: 0 },
      ],
      { duration: 750 + Math.random() * 300, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
    ).finished.then(() => h.remove());
  }
}
