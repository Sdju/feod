import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/modules/Product/server";
import ProductPage from "@/screens/catalog/[id]";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ id: String(product.id) }));
}

export async function generateMetadata({ params }: PageProps<"/catalog/[id]">): Promise<Metadata> {
  const product = await getProduct(Number((await params).id));
  return product ? { title: product.title, description: product.description } : {};
}

export default async function Page({ params }: PageProps<"/catalog/[id]">) {
  const product = await getProduct(Number((await params).id));
  if (!product) notFound();
  return <ProductPage product={product} />;
}
