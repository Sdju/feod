import { NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { RouterLink } from '@angular/router'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'small' | 'medium' | 'large'

@Component({
  selector: 'app-main-button',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './main-button.component.html',
  styleUrl: './main-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainButtonComponent {
  readonly variant = input<ButtonVariant>('primary')
  readonly size = input<ButtonSize>('medium')
  readonly disabled = input(false)
  readonly type = input<'button' | 'submit' | 'reset'>('button')
  readonly ariaLabel = input<string | null>(null)
  readonly link = input<string | null>(null)
  readonly buttonClick = output<MouseEvent>()

  buttonClasses(): string {
    return `main-button main-button--${this.variant()} main-button--${this.size()}`
  }
}
