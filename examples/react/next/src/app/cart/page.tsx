import type { Metadata } from "next";
import CartPage from "@/screens/cart";

export const metadata: Metadata = { title: "Корзина" };

export default function Page() {
  return <CartPage />;
}
