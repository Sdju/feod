import { ProductDetails, type Product } from "@/modules/Product";
export default function ProductPage({ product }: { product: Product }) {
  return <ProductDetails product={product} />;
}
