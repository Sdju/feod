<script setup lang="ts">
import type { Product } from '../types'
import AddToCartButton from './AddToCartButton.vue'

defineProps<{ product: Product }>()
</script>

<template>
  <article class="product-details">
    <img
      :src="product.image"
      :alt="product.title"
      class="product-details__image"
    >
    <div class="product-details__content">
      <h1 class="product-details__title">
        {{ product.title }}
      </h1>
      <p class="product-details__description">
        {{ product.description }}
      </p>
      <p class="product-details__price">
        {{ product.price }} ₽
      </p>
      <AddToCartButton :product="product" />
      <NuxtLink
        to="/catalog"
        class="product-details__back"
      >
        ← Вернуться в каталог
      </NuxtLink>
    </div>
  </article>
</template>

<style scoped lang="scss">
.product-details {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;
  align-items: start;

  &__image {
    width: 100%;
    border-radius: 8px;
    object-fit: cover;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  &__title {
    margin: 0;
    font-size: 32px;
  }

  &__description {
    margin: 0;
    color: #666;
    line-height: 1.5;
  }

  &__price {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  &__back {
    color: #333;
  }
}

@media (max-width: 700px) {
  .product-details {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
