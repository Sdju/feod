import { getProducts } from '@/modules/Product/index.server'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => ({ products: getProducts() })
