import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '@/modules/Cart'
import ProductCard from '../ui/ProductCard.vue'

const product = { id: 1, title: 'Продукт 1', price: 1000, description: 'Описание', image: '/placeholder.png' }

describe('ProductCard', () => {
  it('adds the product to the cart through the public Cart API', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(ProductCard, { props: { product }, global: { plugins: [pinia] } })

    await wrapper.get('button').trigger('click')

    expect(useCartStore().items).toEqual([{ id: 1, title: 'Продукт 1', price: 1000, image: '/placeholder.png', quantity: 1 }])
    expect(wrapper.get('button').text()).toBe('В корзине')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
