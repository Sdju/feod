<script setup lang="ts">
import ProductCard from './ProductCard.vue'
import type { Product } from '../types'

defineProps<{ products: Product[] }>()
</script>

<template>
  <div class="product-list">
    <h1 class="product-list__title">
      Каталог продуктов
    </h1>

    <div class="product-list__grid">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.product-list {
  &__title {
    margin-bottom: 32px;
    font-size: 32px;
    font-weight: bold;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
}
</style>
