const KEY = 'edulearn_cart';

export interface CartItem {
    id: string;
    title: string;
    price: number;
    image: string;
    instructor: string;
}

export function getCart(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveCart(items: CartItem[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(items));
        window.dispatchEvent(new Event('cartUpdated'));
    } catch { /* ignore */ }
}

export function addToCart(item: CartItem): boolean {
    const cart = getCart();
    if (cart.some(i => i.id === item.id)) return false;
    saveCart([...cart, item]);
    return true;
}

export function removeFromCart(id: string) {
    saveCart(getCart().filter(i => i.id !== id));
}

export function isInCart(id: string): boolean {
    return getCart().some(i => i.id === id);
}
