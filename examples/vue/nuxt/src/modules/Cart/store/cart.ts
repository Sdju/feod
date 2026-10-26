import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  image: string
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalAmount = computed(() => {
    return items.value.reduce((total, item) => total + item.price * item.quantity, 0)
  })

  const itemsCount = computed(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0)
  })

  function addItem(item: Omit<CartItem, 'quantity'>) {
    const existingItem = items.value.find(i => i.id === item.id)

    if (existingItem) {
      existingItem.quantity++
    } else {
      items.value.push({ id: item.id, title: item.title, price: item.price, image: item.image, quantity: 1 })
    }
  }

  function updateQuantity(itemId: number, quantity: number) {
    const item = items.value.find(i => i.id === itemId)
    if (!item) {
      return
    }
    if (quantity > 0) {
      item.quantity = quantity
      return
    }
    items.value = items.value.filter(existingItem => existingItem.id !== itemId)
  }

  function removeItem(itemId: number) {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  function clearCart() {
    items.value = []
  }

  return {
    items,
    totalAmount,
    itemsCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  }
})
