import { error } from '@sveltejs/kit'
import { getProduct } from '@/modules/Product/index.server'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ params }) => {
  const product = getProduct(Number(params.id))
  if (!product) error(404, 'Товар не найден')
  return { product }
}
