import Image from "next/image";
import Link from "next/link";
import type { Product } from "../types";
import { AddToCartButton } from "./AddToCartButton";
import "./ProductCard.scss";
export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Image
        src={product.image}
        alt={product.title}
        width={400}
        height={200}
        sizes="(max-width: 700px) 100vw, 400px"
        className="product-card__image"
      />
      <div className="product-card__content">
        <h2 className="product-card__title">
          <Link href={`/catalog/${product.id}`} className="product-card__link">
            {product.title}
          </Link>
        </h2>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__price">{product.price} ₽</span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
