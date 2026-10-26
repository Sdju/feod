import { ChangeDetectionStrategy, Component } from '@angular/core'
import { PRODUCT_CATALOG } from '../data/catalog'
import { ProductCardComponent } from './product-card.component'

@Component({
  selector: 'app-product-list',
  imports: [ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  readonly products = PRODUCT_CATALOG
}
