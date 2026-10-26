import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { MainButtonComponent } from '@/common/ui/main-button.component'
import { CartService } from '@/modules/Cart'
import type { Product } from '../types'

@Component({
  selector: 'app-product-card',
  imports: [MainButtonComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<Product>()
  private readonly cart = inject(CartService)

  inCart(): boolean {
    return this.cart.items().some(item => item.id === this.product().id)
  }

  addToCart(): void {
    this.cart.addItem(this.product())
  }
}
