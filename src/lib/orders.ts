// Commandes passées sur cet appareil (mode démo) : servent à la page de suivi.
// Une fois la boutique branchée à Stripe et au transporteur, le suivi lira leurs données.
import { persisted } from './saved';

export interface OrderLine {
  id: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  price: number;
  image: string;
}
export interface Order {
  id: string;
  email: string;
  date: string;
  method: string;
  total: number;
  lines: OrderLine[];
  gift?: { message: string };
  /** Demande de retour ou d'échange faite depuis la page de suivi */
  return?: { id: string; date: string; items: { key: string; action: string }[]; reason: string };
}

export const $orders = persisted<Order[]>('dimension-orders-v1', []);

export function saveOrder(order: Order) {
  $orders.set([order, ...$orders.get().filter((o) => o.id !== order.id)].slice(0, 20));
}

export function findOrder(id: string, email: string) {
  const norm = (s: string) => s.trim().toLowerCase();
  return $orders.get().find((o) => norm(o.id) === norm(id) && norm(o.email) === norm(email)) ?? null;
}
