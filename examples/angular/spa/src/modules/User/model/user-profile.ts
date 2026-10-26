export interface UserProfile {
  name: string
  email: string
  phone: string
  address: string
  avatar: string
}

export type UserProfileField = Exclude<keyof UserProfile, 'avatar'>
