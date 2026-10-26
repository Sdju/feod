"use client";

import MainButton from "@/common/ui/MainButton";
import { useCartStore } from "../store/cart";
import CartItem from "./CartItem";
import "./CartView.scss";
export function CartView() {
  const cart = useCartStore();
  return (
    <div className="cart-view">
      <h1 className="cart-view__title">Корзина</h1>
      {cart.items.length ? (
        <div className="cart-view__content">
          <ul className="cart-items">
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQuantityChange={(quantity) => cart.updateQuantity(item.id, quantity)}
                onRemove={() => cart.removeItem(item.id)}
              />
            ))}
          </ul>
          <div className="cart-summary">
            <div className="cart-summary__total">
              <span>Итого:</span>
              <span>{cart.totalAmount} ₽</span>
            </div>
            <MainButton size="large" onClick={cart.clearCart}>
              Оформить заказ
            </MainButton>
          </div>
        </div>
      ) : (
        <div className="cart-view__empty">
          <p>Ваша корзина пуста</p>
        </div>
      )}
    </div>
  );
}
