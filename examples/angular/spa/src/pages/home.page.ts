import { ChangeDetectionStrategy, Component } from '@angular/core'
import { MainButtonComponent } from '@/common/ui/main-button.component'

const placeholder = '/assets/placeholder.png'

@Component({
  selector: 'app-home-page',
  imports: [MainButtonComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  readonly placeholder = placeholder
  readonly features = [
    { title: 'Широкий ассортимент', description: 'Тысячи товаров на любой вкус' },
    { title: 'Быстрая доставка', description: 'Доставляем заказы в кратчайшие сроки' },
    { title: 'Гарантия качества', description: 'Только проверенные товары от надежных поставщиков' },
  ]
}
