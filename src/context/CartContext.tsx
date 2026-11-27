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
    return parsed
      .filter(
        (item): item is CartItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as CartItem).id === "string" &&
          (item as CartItem).id.length > 0 &&
          typeof (item as CartItem).cartQuantitySqft === "number" &&
          Number.isFinite((item as CartItem).cartQuantitySqft) &&
          Math.floor((item as CartItem).cartQuantitySqft) >= 1 &&
          typeof (item as CartItem).price_per_sqft === "number" &&
          Number.isFinite((item as CartItem).price_per_sqft) &&
          (item as CartItem).price_per_sqft >= 0
      )
      .map((item) => ({
        ...item,
        image: typeof item.image === "string" && item.image.trim() ? item.image : "/tiles/floor_agaria.jpg",
        cartQuantitySqft: Math.floor(item.cartQuantitySqft),
      }));
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

  // Store the owning storageKey alongside items so an account switch never
  // flushes the previous user's items into the new user's storageKey.
  const [cartState, setCartState] = useState<{ key: string | null; items: CartItem[] }>({
    key: null,
    items: [],
  });
  const itemsRef = useRef<CartItem[]>([]);
  const items = cartState.items;

  useEffect(() => {
    itemsRef.current = cartState.items;
  }, [cartState.items]);

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

    itemsRef.current = nextItems;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartState({ key: storageKey, items: nextItems });
  }, [storageKey, user?.id]);

  useEffect(() => {
    if (cartState.key !== storageKey) return;
    writeStorage(storageKey, cartState.items);
  }, [cartState, storageKey]);

  const addToCart = useCallback(
    (product: Omit<CartItem, "cartQuantitySqft">, sqft: number): boolean => {
      if (!Number.isFinite(sqft) || sqft <= 0) return false;
      const normalizedSqft = Math.floor(sqft);
      if (normalizedSqft <= 0) return false;

      const maxStock = product.stockSqft ?? Infinity;
      if (normalizedSqft > maxStock) return false;

      // Compute synchronously against itemsRef so React 19 concurrent batching
      // never causes addToCart to return a stale `false`.
      const current = itemsRef.current;
      const existing = current.find((item) => item.id === product.id);
      let nextItems: CartItem[];

      if (existing) {
        const newTotal = existing.cartQuantitySqft + normalizedSqft;
        if (newTotal > maxStock) return false;
        nextItems = current.map((item) =>
          item.id === product.id
            ? { ...item, stockSqft: product.stockSqft ?? item.stockSqft, cartQuantitySqft: newTotal }
            : item
        );
      } else {
        nextItems = [
          ...current,
          { ...product, cartQuantitySqft: Math.min(normalizedSqft, maxStock) },
        ];
      }

      itemsRef.current = nextItems;
      setCartState((prev) => ({ key: prev.key ?? storageKey, items: nextItems }));
      return true;
    },
    [storageKey]
  );

  const removeFromCart = useCallback((productId: string) => {
    const nextItems = itemsRef.current.filter((item) => item.id !== productId);
    itemsRef.current = nextItems;
    setCartState((prev) => ({ ...prev, items: nextItems }));
  }, []);

  const updateQuantity = useCallback((productId: string, sqft: number) => {
    if (!Number.isFinite(sqft)) return;
    const normalized = Math.floor(sqft);
    if (normalized <= 0) {
      const nextItems = itemsRef.current.filter((item) => item.id !== productId);
      itemsRef.current = nextItems;
      setCartState((prev) => ({ ...prev, items: nextItems }));
      return;
    }

    const nextItems = itemsRef.current.flatMap((item) => {
      if (item.id !== productId) return [item];
      const maxStock = item.stockSqft ?? Infinity;
      if (maxStock <= 0) return [];
      const clamped = Math.min(normalized, maxStock);
      return [{ ...item, cartQuantitySqft: Math.max(1, clamped) }];
    });
    itemsRef.current = nextItems;
    setCartState((prev) => ({ ...prev, items: nextItems }));
  }, []);

  const clearCart = useCallback(() => {
    itemsRef.current = [];
    setCartState((prev) => ({ ...prev, items: [] }));
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
