```ts
// modules/UserManagement/adapters/secondary/api/userApi.ts
import { User } from '../../../domain/entities/User'

interface UserResponse {
  id: string
  email: string
}

export class UserApi {
  async fetchUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${encodeURIComponent(id)}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const dto: UserResponse = await response.json()
    return new User(dto.id, dto.email)
  }
}
```
