import { ChangeDetectionStrategy, Component } from '@angular/core'

const principles = [
  { title: 'Фрактальность', description: 'Модули можно дробить на подмодули без смены правил.' },
  { title: 'Сущности', description: 'Каждый файл имеет роль и ограничения по использованию.' },
  { title: 'Уровни', description: 'Чёткие правила импортов показывают допустимые связи между частями проекта.' },
]

@Component({
  selector: 'app-about-page',
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  readonly principles = principles
}
