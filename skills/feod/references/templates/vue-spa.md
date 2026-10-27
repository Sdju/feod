# FEOD — Vue SPA templates

## Vue 3 + Vite + TypeScript — minimal start

### src/app/entry.ts

```ts
import './styles/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

### src/app/router.ts

```ts
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/index.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomePage },
  ],
})
```

### src/pages/index.vue (thin page)

```vue
<script setup lang="ts">
import { TodoList, useTodos } from '@/modules/Todos'
import { TodoFilterBar } from '@/modules/TodoFilters'

const { todos, addTodo, toggleTodo, removeTodo } = useTodos()
</script>

<template>
  <main>
    <TodoFilterBar />
    <TodoList
      :todos="todos"
      @toggle="toggleTodo"
      @remove="removeTodo"
      @add="addTodo"
    />
  </main>
</template>
```

page is thin but not just router to the module.

BAD:
```
<script setup lang="ts">
import { UserPage } from '@/modules/User'
</script>

<template>
  <UserPage />
</template>
```


## Todos module

### Structure

```
modules/Todos/
  types/todo.types.ts
  api/todoApi.ts
  composables/useTodos.ts
  components/TodoItem.vue
  components/TodoList.vue
  index.ts
```

### modules/Todos/types/todo.types.ts

```ts
export interface Todo {
  id: string
  title: string
  completed: boolean
}

export interface CreateTodoDto {
  title: string
}
```

### modules/Todos/composables/useTodos.ts

```ts
import { ref, computed } from 'vue'
import type { Todo, CreateTodoDto } from '../types/todo.types'
import { fetchTodos, createTodo, deleteTodo } from '../api/todoApi'

export function useTodos() {
  const todos = ref<Todo[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    todos.value = await fetchTodos()
    loading.value = false
  }

  function addTodo(dto: CreateTodoDto) {
    todos.value.push(createTodo(dto))
  }

  function toggleTodo(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) todo.completed = !todo.completed
  }

  function removeTodo(id: string) {
    todos.value = todos.value.filter(t => t.id !== id)
  }

  const activeCount = computed(() => todos.value.filter(t => !t.completed).length)

  return { todos, loading, load, addTodo, toggleTodo, removeTodo, activeCount }
}
```

### modules/Todos/index.ts

```ts
export { default as TodoItem } from './components/TodoItem.vue'
export { default as TodoList } from './components/TodoList.vue'
export { useTodos } from './composables/useTodos'
export type { Todo, CreateTodoDto } from './types/todo.types'
```

## Common

### common/utilities/formatDate.ts

```ts
export function formatDate(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale)
}
```

### common/constants/routes.ts

```ts
export const ROUTES = {
  HOME: 'home',
  TASKS: 'tasks',
  ABOUT: 'about',
} as const
```

## Global

### globals/vue-router.d.ts

```ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
  }
}
```

## Module with pages and routes

### modules/Auth/pages/login.vue

```vue
<script setup lang="ts">
import { useAuth } from '../composables/useAuth'
const { login, loading } = useAuth()
</script>

<template>
  <form @submit.prevent="login">
    <!-- ... -->
  </form>
</template>
```

### modules/Auth/routes.ts

```ts
import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('./pages/login.vue') },
]
```

### app/router.ts (assembling routes)

```ts
import { authRoutes } from '@/modules/Auth'

export default createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    // other routes
  ],
})
```

## IoC: integration from app

### modules/User/composables/useUsers.ts

```ts
export interface NotificationService {
  notify(message: string): void
}

export function useUsers(notificationService?: NotificationService) {
  const notify = notificationService?.notify ?? console.log

  function onUserCreated(name: string) {
    notify(`User ${name} created`)
  }

  return { onUserCreated }
}
```

### app/integrations/analytics.ts

```ts
import type { NotificationService } from '@/modules/User'

export const analyticsNotify: NotificationService = {
  notify(message) {
    // gtag, sentry, etc.
    console.info('[analytics]', message)
  },
}
```

### app/init/users.ts

```ts
import { analyticsNotify } from '../integrations/analytics'
// pass analyticsNotify when bootstrapping the composable/store
```

## tsconfig paths

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "src/globals/**/*.d.ts"]
}
```

## package.json feod section

Requires a plugin exporting `configFromProject` and an explicit loader call.
For npm `0.1.0` (before the helpers), use per-rule options from [lint.md](../lint.md).

```json
{
  "name": "my-feod-app",
  "feod": {
    "srcRoot": "src",
    "aliasPrefix": "@",
    "layerDirs": {
      "app": "app",
      "pages": "pages",
      "modules": "modules",
      "common": "common",
      "global": "globals"
    },
    "common": { "maxDepth": 1 },
    "modulePages": true
  }
}
```

## React SPA (adaptation)

```
src/
  app/
    entry.tsx
    router.tsx
    layouts/
  pages/
    index.tsx
    [id].tsx
  modules/
    Todos/
      hooks/useTodos.ts
      components/TodoList.tsx
      index.ts
  common/
    ui/Button.tsx
  globals/
    env.d.ts
```

Import rules are identical; `composables/` → `hooks/`, `.vue` → `.tsx`.

## Single-file module

```
modules/formatCurrency.ts
```

```ts
/** @module formatCurrency — currency formatting */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}
```

In ESLint: `"singleFileModules": true`

