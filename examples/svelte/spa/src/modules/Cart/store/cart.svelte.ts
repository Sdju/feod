export interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  image: string
}

export class CartStore {
  items = $state<CartItem[]>([])
  totalAmount = $derived(this.items.reduce((sum, item) => sum + item.price * item.quantity, 0))
  itemsCount = $derived(this.items.reduce((sum, item) => sum + item.quantity, 0))

  addItem(item: Omit<CartItem, 'quantity'>) {
    const existing = this.items.find(row => row.id === item.id)
    if (existing) {
      existing.quantity += 1
    } else {
      this.items.push({ id: item.id, title: item.title, price: item.price, image: item.image, quantity: 1 })
    }
  }

  updateQuantity(id: number, quantity: number) {
    if (quantity > 0) {
      const existing = this.items.find(row => row.id === id)
      if (existing) existing.quantity = quantity
    } else {
      this.removeItem(id)
    }
  }

  removeItem(id: number) {
    this.items = this.items.filter(row => row.id !== id)
  }

  clearCart() {
    this.items = []
  }
}
