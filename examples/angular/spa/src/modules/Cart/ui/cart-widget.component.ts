import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CartService } from '../store/cart.service'

@Component({
  selector: 'app-cart-widget',
  imports: [RouterLink],
  templateUrl: './cart-widget.component.html',
  styleUrl: './cart-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartWidgetComponent {
  readonly cart = inject(CartService)
}
