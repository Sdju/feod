import { ChangeDetectionStrategy, Component } from '@angular/core'
import { UserProfileComponent } from '@/modules/User'

@Component({
  selector: 'app-profile-page',
  imports: [UserProfileComponent],
  template: '<app-user-profile />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {}
