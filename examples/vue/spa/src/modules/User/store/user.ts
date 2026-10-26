import { defineStore } from 'pinia'
import { ref } from 'vue'
import placeholder from '@/common/assets/img/placeholder.png'

export interface User {
  id: number
  name: string
  email: string
  avatar: string
  phone: string
  address: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User>({
    id: 1,
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    avatar: placeholder,
    phone: '+7 (999) 123-45-67',
    address: 'г. Москва, ул. Примерная, д. 1'
  })

  function updateProfile(data: Partial<User>) {
    user.value = {
      ...user.value,
      ...data
    }
  }

  return {
    user,
    updateProfile
  }
})
