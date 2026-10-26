import type { Product } from '../types'

const placeholder = '/assets/placeholder.png'

export const PRODUCT_CATALOG: readonly Product[] = [
  { id: 1, title: 'Продукт 1', price: 1000, description: 'Описание продукта 1', image: placeholder },
  { id: 2, title: 'Продукт 2', price: 2000, description: 'Описание продукта 2', image: placeholder },
  { id: 3, title: 'Продукт 3', price: 3000, description: 'Описание продукта 3', image: placeholder },
]
