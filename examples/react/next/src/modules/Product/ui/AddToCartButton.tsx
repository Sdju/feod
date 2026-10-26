"use client";

import MainButton from "@/common/ui/MainButton";
import { useCartStore } from "@/modules/Cart";
import type { Product } from "../types";
export function AddToCartButton({ product }: { product: Product }) {
  const cart = useCartStore();
  const isInCart = cart.items.some((item) => item.id === product.id);
  return (
    <MainButton
      variant={isInCart ? "secondary" : "primary"}
      disabled={isInCart}
      onClick={() => cart.addItem(product)}
    >
      {isInCart ? "В корзине" : "В корзину"}
    </MainButton>
  );
}
