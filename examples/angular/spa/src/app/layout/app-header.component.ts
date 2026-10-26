import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { CartWidgetComponent } from '@/modules/Cart'
import { UserWidgetComponent } from '@/modules/User'

@Component({
  selector: 'app-header',
  imports: [CartWidgetComponent, RouterLink, RouterLinkActive, UserWidgetComponent],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderComponent {
  readonly navigationItems = [
    { name: 'Главная', path: '/' },
    { name: 'Каталог', path: '/catalog' },
    { name: 'О проекте', path: '/about' },
  ]
}
