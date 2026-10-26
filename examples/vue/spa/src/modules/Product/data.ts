import placeholder from '@/common/assets/img/placeholder.png'
import type { Product } from './types'

export const products: Product[] = [1, 2, 3].map(id => ({
  id,
  title: `Продукт ${id}`,
  price: id * 1000,
  description: `Описание продукта ${id}`,
  image: placeholder
}))
