import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../store/cart'

const product = { id: 1, title: 'Продукт 1', price: 1000, image: '/placeholder.png' }

describe('Cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a product once and increments its quantity on repeat', () => {
    const cart = useCartStore()
    cart.addItem(product)
    cart.addItem(product)
    expect(cart.items).toEqual([{ ...product, quantity: 2 }])
    expect(cart.itemsCount).toBe(2)
    expect(cart.totalAmount).toBe(2000)
  })

  it('removes an item when its quantity drops to zero', () => {
    const cart = useCartStore()
    cart.addItem(product)
    cart.updateQuantity(product.id, 0)
    expect(cart.items).toEqual([])
  })

  it('clears all items', () => {
    const cart = useCartStore()
    cart.addItem(product)
    cart.addItem({ ...product, id: 2 })
    cart.clearCart()
    expect(cart.itemsCount).toBe(0)
  })
})
