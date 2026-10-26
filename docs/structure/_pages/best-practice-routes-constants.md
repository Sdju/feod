```ts
// common/constants/routes.ts
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${encodeURIComponent(id)}`,
  }
}
```

Пути используются при навигации; они не заменяют описания маршрутов в `app/router.ts`.

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
import { ROUTES } from '@/common/constants/routes'
import { RouterLink } from 'vue-router'
</script>

<template><RouterLink :to="ROUTES.PRODUCTS.LIST">Каталог</RouterLink></template>
```
