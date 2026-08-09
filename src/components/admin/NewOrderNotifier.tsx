"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Toast {
  id: string;
  orderId: string;
  total: string;
}

/**
 * Global, layout-level listener that surfaces a toast the moment a new order
 * is inserted anywhere in the store — so admins on the Dashboard or Inventory
 * page don't need to have the Orders tab open to notice new business.
 */
export function NewOrderNotifier() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-new-order-notifier")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const id = payload.new.id as string;
          const total = payload.new.total as string;
          const toast: Toast = { id: `${id}-${Date.now()}`, orderId: id, total };

          setToasts((prev) => [...prev, toast]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }, 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="flex items-start gap-3 bg-zinc-900 text-white rounded-2xl shadow-2xl p-4 cursor-pointer animate-in slide-in-from-bottom-4 fade-in duration-300 hover:bg-zinc-800 transition-colors"
          onClick={() => router.push("/admin/orders")}
        >
          <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">New order received!</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              #{toast.orderId.substring(0, 8).toUpperCase()} · {toast.total}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismiss(toast.id);
            }}
            className="text-gray-400 hover:text-white flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
