'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
    id: string;
    title: string;
    price: number;
    image: string;
    instructor: string;
}

interface CartContextValue {
    cartItems: CartItem[];
    cartCount: number;
    cartTotal: number;
    addToCart: (item: CartItem) => boolean; // returns false if already in cart
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'edulearn_cart';

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setCartItems(JSON.parse(stored));
        } catch {
            // ignore
        }
    }, []);

    const cartTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    useEffect(() => {
        if (cartItems.length > 0 || localStorage.getItem(STORAGE_KEY)) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
            } catch {
                // ignore
            }
        }
    }, [cartItems]);

    const addToCart = useCallback((item: CartItem): boolean => {
        // We use a functional update but we check the previous state to return the correct boolean
        let wasAdded = false;
        setCartItems(prev => {
            if (prev.some(i => i.id === item.id)) {
                wasAdded = false;
                return prev;
            }
            wasAdded = true;
            return [...prev, item];
        });
        // Note: wasAdded might still be problematic if setCartItems is fully async in some React versions,
        // but for modern React functional updates, this local variable pattern is often used.
        // However, a safer way is to check the current state if possible, but state is stale here.
        // Let's use the most reliable way:
        return !cartItems.some(i => i.id === item.id);
    }, [cartItems]);

    const removeFromCart = useCallback((id: string) => {
        setCartItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const isInCart = useCallback((id: string) => {
        return cartItems.some(i => i.id === id);
    }, [cartItems]);

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount: cartItems.length,
            cartTotal,
            addToCart,
            removeFromCart,
            clearCart,
            isInCart,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used inside CartProvider');
    return ctx;
}
