import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooterComponent {
  readonly currentYear = new Date().getFullYear()
}
