<script setup lang="ts">
import { ProductList } from '@/modules/Product'

const { data: products } = await useFetch('/api/products', { default: () => [] })

useHead({ title: 'Каталог' })
</script>

<template>
  <ProductList :products="products" />
</template>
