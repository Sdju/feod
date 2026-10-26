import { getProducts } from '@/modules/Product/server'

export default defineEventHandler(() => getProducts())
