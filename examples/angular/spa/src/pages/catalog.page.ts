import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ProductListComponent } from '@/modules/Product'

@Component({
  selector: 'app-catalog-page',
  imports: [ProductListComponent],
  template: '<app-product-list />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent {}
