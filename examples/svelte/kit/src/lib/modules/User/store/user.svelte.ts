import placeholder from '@/common/assets/img/placeholder.png'

export interface User {
  id: number
  name: string
  email: string
  avatar: string
  phone: string
  address: string
}

export class UserStore {
  user = $state<User>({
    id: 1,
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    avatar: placeholder,
    phone: '+7 (999) 123-45-67',
    address: 'г. Москва, ул. Примерная, д. 1',
  })

  updateProfile(data: Partial<User>) {
    this.user = { ...this.user, ...data }
  }
}
