"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

// ── Types ──────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  image: string;
  category: string;
  price_per_sqft: number;
  cartQuantitySqft: number;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Omit<CartItem, "cartQuantitySqft">, sqft: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, sqft: number) => void;
  clearCart: () => void;
}

// ── Constants ──────────────────────────────────────────

const STORAGE_KEY = "un-tiles-cart";

const CartContext = createContext<CartContextType | null>(null);

// ── Helpers ────────────────────────────────────────────

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic shape check
    return parsed.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as CartItem).id === "string" &&
        typeof (item as CartItem).cartQuantitySqft === "number"
    );
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently degrade.
  }
}

// ── Provider ───────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  // Lazy init from localStorage
  const [items, setItems] = useState<CartItem[]>(() => readStorage());

  // Sync to localStorage on every change
  useEffect(() => {
    writeStorage(items);
  }, [items]);

  const addToCart = useCallback(
    (product: Omit<CartItem, "cartQuantitySqft">, sqft: number) => {
      if (sqft <= 0) return;

      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, cartQuantitySqft: item.cartQuantitySqft + sqft }
              : item
          );
        }
        return [...prev, { ...product, cartQuantitySqft: sqft }];
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, sqft: number) => {
    if (sqft <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, cartQuantitySqft: sqft } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartCount = items.length;

  const cartTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.price_per_sqft * item.cartQuantitySqft,
        0
      ),
    [items]
  );

  const value = useMemo<CartContextType>(
    () => ({
      items,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [items, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
