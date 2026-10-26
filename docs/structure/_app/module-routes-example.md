```ts
// modules/Auth/routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  { path: '/auth/login', component: () => import('./pages/login.vue') }
]
```
