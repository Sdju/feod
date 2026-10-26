import { getContext, setContext } from 'svelte'
import { CartStore } from './cart.svelte'

const key = Symbol('feod-cart')

export function provideCart(): CartStore {
  const store = new CartStore()
  setContext(key, store)
  return store
}

export function useCart(): CartStore {
  const store = getContext<CartStore | undefined>(key)
  if (!store) throw new Error('Cart provider is missing')
  return store
}
