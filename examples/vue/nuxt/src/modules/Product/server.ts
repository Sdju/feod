// Серверный публичный API модуля: его вызывают только обработчики Nitro в src/app/server.
import { products } from './data'
import type { Product } from './types'

export function getProducts(): Product[] {
  return products
}

export function getProduct(id: number): Product | undefined {
  return products.find(product => product.id === id)
}
