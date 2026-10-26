import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { MainButtonComponent } from '@/common/ui/main-button.component'
import { UserService } from '../store/user.service'
import type { UserProfile, UserProfileField } from '../model/user-profile'

@Component({
  selector: 'app-user-profile',
  imports: [MainButtonComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  readonly user = inject(UserService)
  readonly editing = signal(false)
  readonly draft = signal<UserProfile>(this.user.profile())

  startEditing(): void {
    this.draft.set({ ...this.user.profile() })
    this.editing.set(true)
  }

  updateField(field: UserProfileField, event: Event): void {
    const target = event.target
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
      return
    }
    this.draft.update(profile => ({ ...profile, [field]: target.value }))
  }

  save(): void {
    this.user.saveProfile(this.draft())
    this.editing.set(false)
  }

  cancel(): void {
    this.draft.set({ ...this.user.profile() })
    this.editing.set(false)
  }
}
