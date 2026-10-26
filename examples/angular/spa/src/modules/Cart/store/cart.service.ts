import { computed, Injectable, signal } from '@angular/core'
import type { CartItem, CartProduct } from '../model/cart-item'

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartItems = signal<CartItem[]>([])
  readonly items = this.cartItems.asReadonly()
  readonly totalAmount = computed(() => this.cartItems().reduce((total, item) => total + item.price * item.quantity, 0))
  readonly itemsCount = computed(() => this.cartItems().reduce((count, item) => count + item.quantity, 0))

  addItem(product: CartProduct): void {
    this.cartItems.update(items => {
      const existingItem = items.find(item => item.id === product.id)
      return existingItem
        ? items.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { id: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 }]
    })
  }

  updateQuantity(itemId: number, quantity: number): void {
    this.cartItems.update(items => items
      .map(item => item.id === itemId ? { ...item, quantity } : item)
      .filter(item => item.quantity > 0))
  }

  removeItem(itemId: number): void {
    this.cartItems.update(items => items.filter(item => item.id !== itemId))
  }

  clearCart(): void {
    this.cartItems.set([])
  }
}
