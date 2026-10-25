// Panier côté client : nanostores + localStorage.
import { atom, computed } from 'nanostores';

export interface CartItem {
  key: string;
  id: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  size: string;
  qty: number;
  max: number;
  image: string;
}

const STORAGE_KEY = 'dimension-cart-v1';

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export const $cart = atom<CartItem[]>(typeof window === 'undefined' ? [] : load());
export const $drawerOpen = atom(false);

$cart.listen((items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* stockage indisponible : le panier reste en mémoire */
  }
});

// Synchronise plusieurs onglets.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) $cart.set(load());
  });
}

export const $count = computed($cart, (items) => items.reduce((n, i) => n + i.qty, 0));
export const $subtotal = computed($cart, (items) => items.reduce((n, i) => n + i.qty * i.price, 0));

export function addItem(item: Omit<CartItem, 'key' | 'qty'>, qty = 1) {
  const key = `${item.id}|${item.color}|${item.size}`;
  const items = $cart.get();
  const existing = items.find((i) => i.key === key);
  if (existing) {
    $cart.set(items.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, i.max) } : i)));
  } else {
    $cart.set([...items, { ...item, key, qty: Math.min(qty, item.max) }]);
  }
}

export function setQty(key: string, qty: number) {
  if (qty <= 0) return removeItem(key);
  $cart.set($cart.get().map((i) => (i.key === key ? { ...i, qty: Math.min(qty, i.max) } : i)));
}

export function removeItem(key: string) {
  $cart.set($cart.get().filter((i) => i.key !== key));
}

export function clearCart() {
  $cart.set([]);
}

export function openDrawer() {
  $drawerOpen.set(true);
}
export function closeDrawer() {
  $drawerOpen.set(false);
}
