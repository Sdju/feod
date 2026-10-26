import type { Product } from "../types";
import ProductCard from "./ProductCard";
import "./ProductList.scss";
export function ProductList({ products }: { products: Product[] }) {
  return (
    <div className="product-list">
      <h1 className="product-list__title">Каталог продуктов</h1>
      <div className="product-list__grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
