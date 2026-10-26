import { Injectable, signal } from '@angular/core'
import type { UserProfile } from '../model/user-profile'

const placeholder = '/assets/placeholder.png'

const INITIAL_PROFILE: UserProfile = {
  name: 'Иван Иванов',
  email: 'ivan@example.com',
  phone: '+7 (999) 123-45-67',
  address: 'Москва, Россия',
  avatar: placeholder,
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly currentProfile = signal<UserProfile>(INITIAL_PROFILE)
  readonly profile = this.currentProfile.asReadonly()

  saveProfile(profile: UserProfile): void {
    this.currentProfile.set({ ...profile })
  }
}
