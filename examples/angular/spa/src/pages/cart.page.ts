import { ChangeDetectionStrategy, Component } from '@angular/core'
import { CartViewComponent } from '@/modules/Cart'

@Component({
  selector: 'app-cart-page',
  imports: [CartViewComponent],
  template: '<app-cart-view />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent {}
