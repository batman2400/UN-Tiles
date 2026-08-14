"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";

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

const BASE_STORAGE_KEY = "un-tiles-cart";
const GUEST_STORAGE_KEY = `${BASE_STORAGE_KEY}-guest`;

const CartContext = createContext<CartContextType | null>(null);

function readStorage(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
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

function mergeCarts(primary: CartItem[], incoming: CartItem[]): CartItem[] {
  const byId = new Map(primary.map((item) => [item.id, { ...item }]));
  for (const item of incoming) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, { ...item });
      continue;
    }
    const maxStock = existing.stockSqft ?? item.stockSqft ?? Infinity;
    existing.cartQuantitySqft = Math.min(
      existing.cartQuantitySqft + item.cartQuantitySqft,
      maxStock
    );
  }
  return [...byId.values()];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id || "guest"}`;
  const loadedKeyRef = useRef<string | null>(null);

  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    let nextItems = readStorage(storageKey);

    if (user?.id) {
      const guestItems = readStorage(GUEST_STORAGE_KEY);
      if (guestItems.length > 0) {
        nextItems = mergeCarts(nextItems, guestItems);
        writeStorage(storageKey, nextItems);
        try {
          window.localStorage.removeItem(GUEST_STORAGE_KEY);
        } catch {
          // Ignore cleanup errors.
        }
      }
    }

    setItems(nextItems);
    loadedKeyRef.current = storageKey;
  }, [storageKey, user?.id]);

  useEffect(() => {
    if (loadedKeyRef.current !== storageKey) return;
    writeStorage(storageKey, items);
  }, [items, storageKey]);

  const addToCart = useCallback(
    (product: Omit<CartItem, "cartQuantitySqft">, sqft: number): boolean => {
      if (sqft <= 0) return false;

      const maxStock = product.stockSqft ?? Infinity;
      if (sqft > maxStock) return false;

      let added = false;
      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          const newTotal = existing.cartQuantitySqft + sqft;
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

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
