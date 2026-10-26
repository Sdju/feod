# Пример: модуль пользователей

Сценарий: страница загружает пользователей и добавляет нового. HTTP и состояние списка остаются в UserManagement; страница обращается к его публичному API. Перед запуском `app` подключает Pinia через `app.use(createPinia())`. Сервер предоставляет GET и POST `/api/users`.

## Структура модуля

<FileTree>
  <FileTreeNode name="modules" type="folder">
    <FileTreeNode name="UserManagement" type="folder">
      <FileTreeNode name="components" type="folder">
        <FileTreeNode name="UserList.vue" type="file" />
        <FileTreeNode name="UserCard.vue" type="file" />
        <FileTreeNode name="UserForm.vue" type="file" />
      </FileTreeNode>
      <FileTreeNode name="composables" type="folder">
        <FileTreeNode name="useUsers.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="api" type="folder">
        <FileTreeNode name="userApi.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="store" type="folder">
        <FileTreeNode name="userStore.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="types" type="folder">
        <FileTreeNode name="user.types.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="index.ts" type="file" bold comment="API, используемый страницей" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

## Типы

```ts
// modules/UserManagement/types/user.types.ts
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface CreateUserDto {
  name: string
  email: string
  role: 'admin' | 'user'
}
```

## HTTP API

```ts
// modules/UserManagement/api/userApi.ts
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
```

## Состояние списка

```ts
// modules/UserManagement/store/userStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '../api/userApi'
import type { User, CreateUserDto } from '../types/user.types'

export const useUserStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadUsers() {
    loading.value = true
    error.value = null
    try {
      users.value = await userApi.getAll()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить список'
    } finally {
      loading.value = false
    }
  }

  async function addUser(dto: CreateUserDto) {
    const user = await userApi.create(dto)
    users.value.push(user)
  }

  return { users, loading, error, loadUsers, addUser }
})
```

## Composable

```ts
// modules/UserManagement/composables/useUsers.ts
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../store/userStore'

export function useUsers() {
  const store = useUserStore()
  const { users, loading, error } = storeToRefs(store)
  onMounted(() => { void store.loadUsers() })
  return { users, loading, error }
}
```

`storeToRefs` сохраняет связь с Pinia при замене массива и изменении `loading`/`error`. Методы вызываются через store.

## Компоненты

```vue
<!-- modules/UserManagement/components/UserCard.vue -->
<template>
  <article><h2>{{ user.name }}</h2><p>{{ user.email }}</p></article>
</template>

<script setup lang="ts">
import type { User } from '../types/user.types'
defineProps<{ user: User }>()
</script>
```



```vue
<!-- modules/UserManagement/components/UserList.vue -->
<script setup lang="ts">
import UserCard from './UserCard.vue'
import { useUsers } from '../composables/useUsers'
const { users, loading, error } = useUsers()
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="error" role="alert">{{ error }}</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id"><UserCard :user="user" /></li>
  </ul>
</template>
```



```vue
<!-- modules/UserManagement/components/UserForm.vue -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useUserStore } from '../store/userStore'
import type { CreateUserDto } from '../types/user.types'

const store = useUserStore()
const form = reactive<CreateUserDto>({ name: '', email: '', role: 'user' })
const submitting = ref(false)
const error = ref<string | null>(null)

async function submit() {
  if (submitting.value) return
  submitting.value = true
  error.value = null
  try {
    await store.addUser({ ...form })
    form.name = ''
    form.email = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось создать пользователя'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <label>Имя <input v-model="form.name" required /></label>
    <label>Email <input v-model="form.email" type="email" required /></label>
    <label>Роль
      <select v-model="form.role">
        <option value="user">Пользователь</option>
        <option value="admin">Администратор</option>
      </select>
    </label>
    <p v-if="error" role="alert">{{ error }}</p>
    <button :disabled="submitting">Создать</button>
  </form>
</template>
```

## Публичный API

```ts
// modules/UserManagement/index.ts
export { default as UserList } from './components/UserList.vue'
export { default as UserForm } from './components/UserForm.vue'
```

Страница использует только два компонента. Store, HTTP-клиент, DTO и UserCard остаются внутри модуля.

## Использование на странице

```vue
<!-- pages/users.vue -->
<script setup lang="ts">
import { UserList, UserForm } from '@/modules/UserManagement'
</script>

<template>
  <h1>Пользователи</h1>
  <UserForm />
  <UserList />
</template>
```
