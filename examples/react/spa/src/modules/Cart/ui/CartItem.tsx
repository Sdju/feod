import MainButton from "@/common/ui/MainButton";
import type { CartItem as Item } from "../store/cart";
import "./CartItem.scss";
export default function CartItem({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: Item;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="cart-item">
      <img src={item.image} alt={item.title} className="cart-item__image" />
      <div className="cart-item__content">
        <h3 className="cart-item__title">{item.title}</h3>
        <p className="cart-item__price">{item.price} ₽</p>
      </div>
      <div className="cart-item__quantity">
        <MainButton
          variant="secondary"
          size="small"
          className="cart-item__quantity-btn"
          onClick={() => onQuantityChange(item.quantity - 1)}
        >
          -
        </MainButton>
        <span className="cart-item__quantity-value">{item.quantity}</span>
        <MainButton
          variant="secondary"
          size="small"
          className="cart-item__quantity-btn"
          onClick={() => onQuantityChange(item.quantity + 1)}
        >
          +
        </MainButton>
      </div>
      <div className="cart-item__total">{item.price * item.quantity} ₽</div>
      <MainButton variant="danger" size="small" onClick={onRemove}>
        Удалить
      </MainButton>
    </li>
  );
}
