```ts
// modules/UserManagement/index.ts
export interface UserRepository {
  create(name: string): Promise<{ id: string; name: string }>
}

export function createUserManagement(repository: UserRepository) {
  return {
    async register(name: string) {
      if (!name.trim()) throw new Error('Укажите имя')
      return repository.create(name.trim())
    }
  }
}
```

```ts
// modules/UserApi/index.ts
export const userRepository = {
  async create(name: string): Promise<{ id: string; name: string }> {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
}
```

```ts
// app/integrations/users.ts
import { createUserManagement } from '@/modules/UserManagement'
import { userRepository } from '@/modules/UserApi'

export const users = createUserManagement(userRepository)
await users.register('Анна')
```

POST `/api/registrations` возвращает `{ id, name }`. UserManagement знает контракт, а выбор HTTP-реализации остаётся в `app`.
