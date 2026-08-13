"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <ServiceWorkerRegister />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
