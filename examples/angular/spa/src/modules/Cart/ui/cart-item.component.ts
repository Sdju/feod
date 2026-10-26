import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { MainButtonComponent } from '@/common/ui/main-button.component'
import type { CartItem } from '../model/cart-item'

@Component({
  selector: 'app-cart-item',
  imports: [MainButtonComponent],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemComponent {
  readonly item = input.required<CartItem>()
  readonly quantityChange = output<number>()
  readonly remove = output<void>()
}
