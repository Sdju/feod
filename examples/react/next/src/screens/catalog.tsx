import { ProductList } from "@/modules/Product";
import { getProducts } from "@/modules/Product/server";
export default async function CatalogPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
