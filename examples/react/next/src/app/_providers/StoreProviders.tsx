"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/modules/Cart";
import { UserProvider } from "@/modules/User";

export function StoreProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <UserProvider>{children}</UserProvider>
    </CartProvider>
  );
}
