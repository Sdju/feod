import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found.page.html',
  styleUrl: './not-found.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
