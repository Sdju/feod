import Image from "next/image";
import Link from "next/link";
import type { Product } from "../types";
import { AddToCartButton } from "./AddToCartButton";
import "./ProductDetails.scss";
export function ProductDetails({ product }: { product: Product }) {
  return (
    <article className="product-details">
      <Image
        src={product.image}
        alt={product.title}
        width={480}
        height={480}
        sizes="(max-width: 700px) 100vw, 480px"
        className="product-details__image"
        priority
      />
      <div className="product-details__content">
        <h1 className="product-details__title">{product.title}</h1>
        <p className="product-details__description">{product.description}</p>
        <p className="product-details__price">{product.price} ₽</p>
        <AddToCartButton product={product} />
        <Link href="/catalog" className="product-details__back">
          ← Вернуться в каталог
        </Link>
      </div>
    </article>
  );
}
