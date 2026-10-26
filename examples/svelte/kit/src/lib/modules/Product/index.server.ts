// Серверный публичный API модуля. Суффикс .server SvelteKit не пускает в клиентский код.
import { products } from './data'
import type { Product } from './types'

export function getProducts(): Product[] {
  return products
}

export function getProduct(id: number): Product | undefined {
  return products.find(product => product.id === id)
}
