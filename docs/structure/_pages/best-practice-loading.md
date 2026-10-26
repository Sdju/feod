```vue
<script setup lang="ts">
import { ProductList, useProducts } from '@/modules/Products'
const { products, loading, error } = useProducts()
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="error" role="alert">{{ error }}</p>
  <ProductList v-else :products="products" />
</template>
```
