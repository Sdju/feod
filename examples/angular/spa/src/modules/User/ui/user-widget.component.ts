import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UserService } from '../store/user.service'

@Component({
  selector: 'app-user-widget',
  imports: [RouterLink],
  templateUrl: './user-widget.component.html',
  styleUrl: './user-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserWidgetComponent {
  readonly user = inject(UserService)
}
