import MainButton from "@/common/ui/MainButton";
import { useCartStore } from "@/modules/Cart";
import type { Product } from "../types";
import "./ProductCard.scss";
export default function ProductCard({ product }: { product: Product }) {
  const cart = useCartStore();
  const isInCart = cart.items.some((item) => item.id === product.id);
  return (
    <article className="product-card">
      <img src={product.image} alt={product.title} className="product-card__image" />
      <div className="product-card__content">
        <h2 className="product-card__title">{product.title}</h2>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__price">{product.price} ₽</span>
          <MainButton
            variant={isInCart ? "secondary" : "primary"}
            disabled={isInCart}
            onClick={() => cart.addItem(product)}
          >
            {isInCart ? "В корзине" : "В корзину"}
          </MainButton>
        </div>
      </div>
    </article>
  );
}
