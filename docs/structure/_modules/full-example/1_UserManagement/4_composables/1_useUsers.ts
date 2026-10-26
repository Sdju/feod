import { ref } from 'vue'
import { userApi } from '../api/userApi'
import type { User, CreateUserDto } from '../types/user.types'
export function useUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      users.value = await userApi.getAll()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить пользователей'
    } finally {
      loading.value = false
    }
  }

  async function createUser(dto: CreateUserDto) {
    const user = await userApi.create(dto)
    users.value.push(user)
    return user
  }

  return { users, loading, error, fetchUsers, createUser }
}
