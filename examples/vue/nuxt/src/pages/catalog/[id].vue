<script setup lang="ts">
import { ProductDetails } from '@/modules/Product'

const route = useRoute('catalog-id')
const { data: product } = await useFetch(`/api/products/${route.params.id}`)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Товар не найден', fatal: true })
}

useHead({
  title: () => product.value?.title,
  meta: [{ name: 'description', content: () => product.value?.description }],
})
</script>

<template>
  <ProductDetails
    v-if="product"
    :product="product"
  />
</template>
