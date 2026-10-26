import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AppFooterComponent } from './layout/app-footer.component'
import { AppHeaderComponent } from './layout/app-header.component'

@Component({
  selector: 'app-root',
  imports: [AppFooterComponent, AppHeaderComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
