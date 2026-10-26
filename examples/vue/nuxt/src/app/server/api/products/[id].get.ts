import { getProduct } from '@/modules/Product/server'

export default defineEventHandler((event) => {
  const product = getProduct(Number(getRouterParam(event, 'id')))
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })
  }
  return product
})
