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
  stockSqft?: number;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Omit<CartItem, "cartQuantitySqft">, sqft: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, sqft: number) => void;
  clearCart: () => void;
}

// ── Constants ──────────────────────────────────────────

const BASE_STORAGE_KEY = "un-tiles-cart";

const CartContext = createContext<CartContextType | null>(null);

// ── Helpers ────────────────────────────────────────────

function readStorage(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
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

function writeStorage(key: string, items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently degrade.
  }
}

// ── Provider ───────────────────────────────────────────

import { useAuth } from "@/context/AuthContext";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id || 'guest'}`;

  // Initialize with empty, then load on mount/key change to avoid hydration mismatch
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStorage(storageKey));
    setIsLoaded(true);
  }, [storageKey]);

  // Sync to localStorage on every change
  useEffect(() => {
    if (isLoaded) {
      writeStorage(storageKey, items);
    }
  }, [items, storageKey, isLoaded]);

  const addToCart = useCallback(
    (product: Omit<CartItem, "cartQuantitySqft">, sqft: number): boolean => {
      if (sqft <= 0) return false;

      // Validate against available stock
      const maxStock = product.stockSqft ?? Infinity;
      if (sqft > maxStock) return false;

      let added = false;
      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          const newTotal = existing.cartQuantitySqft + sqft;
          // Cap at available stock
          if (newTotal > maxStock) return prev;
          added = true;
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, cartQuantitySqft: newTotal }
              : item
          );
        }
        added = true;
        return [...prev, { ...product, cartQuantitySqft: Math.min(sqft, maxStock) }];
      });
      return added;
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
