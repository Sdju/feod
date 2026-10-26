import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MainButtonComponent } from '@/common/ui/main-button.component'
import { CartService } from '../store/cart.service'
import { CartItemComponent } from './cart-item.component'

@Component({
  selector: 'app-cart-view',
  imports: [CartItemComponent, MainButtonComponent, RouterLink],
  templateUrl: './cart-view.component.html',
  styleUrl: './cart-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartViewComponent {
  readonly cart = inject(CartService)

  updateQuantity(itemId: number, quantity: number): void {
    this.cart.updateQuantity(itemId, quantity)
  }

  removeItem(itemId: number): void {
    this.cart.removeItem(itemId)
  }

  clearCart(): void {
    this.cart.clearCart()
  }
}
