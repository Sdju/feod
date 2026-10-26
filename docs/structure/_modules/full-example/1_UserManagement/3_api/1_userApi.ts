import type { User, CreateUserDto } from '../types/user.types'
export const userApi = {
  async getAll(): Promise<User[]> {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },

  async create(dto: CreateUserDto): Promise<User> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
}
