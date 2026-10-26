import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
export interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
}
interface CartStore {
  items: CartItem[];
  totalAmount: number;
  itemsCount: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
}
const CartContext = createContext<CartStore | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const store = useMemo<CartStore>(
    () => ({
      items,
      totalAmount: items.reduce((total, item) => total + item.price * item.quantity, 0),
      itemsCount: items.reduce((total, item) => total + item.quantity, 0),
      addItem: (item) =>
        setItems((current) =>
          current.some((existing) => existing.id === item.id)
            ? current.map((existing) =>
                existing.id === item.id ? { ...existing, quantity: existing.quantity + 1 } : existing,
              )
            : [...current, { id: item.id, title: item.title, price: item.price, image: item.image, quantity: 1 }],
        ),
      updateQuantity: (id, quantity) =>
        setItems((current) =>
          quantity > 0
            ? current.map((item) => (item.id === id ? { ...item, quantity } : item))
            : current.filter((item) => item.id !== id),
        ),
      removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
      clearCart: () => setItems([]),
    }),
    [items],
  );
  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}
export function useCartStore() {
  const store = useContext(CartContext);
  if (!store) throw new Error("useCartStore must be used within CartProvider");
  return store;
}
