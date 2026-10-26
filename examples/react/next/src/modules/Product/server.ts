import "server-only";
import { cache } from "react";
import { products } from "./data";
import type { Product } from "./types";

// Серверный публичный API: доступ к данным каталога только из Server Components,
// route handlers и generate*-функций. cache() убирает повторные чтения в одном запросе.
export const getProducts = cache(async (): Promise<Product[]> => products);

export const getProduct = cache(
  async (id: number): Promise<Product | undefined> => products.find((product) => product.id === id),
);
