<script setup lang="ts">
import type { Product } from '../types'
import AddToCartButton from './AddToCartButton.vue'

defineProps<{ product: Product }>()
</script>

<template>
  <article class="product-card">
    <img
      :src="product.image"
      :alt="product.title"
      class="product-card__image"
    >
    <div class="product-card__content">
      <h2 class="product-card__title">
        <NuxtLink
          :to="`/catalog/${product.id}`"
          class="product-card__link"
        >
          {{ product.title }}
        </NuxtLink>
      </h2>
      <p class="product-card__description">
        {{ product.description }}
      </p>
      <div class="product-card__footer">
        <span class="product-card__price">{{ product.price }} ₽</span>
        <AddToCartButton :product="product" />
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }

  &__image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  &__link {
    color: inherit;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__content {
    padding: 16px;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
  }

  &__description {
    margin: 0 0 16px;
    color: #666;
    font-size: 14px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__price {
    font-size: 20px;
    font-weight: bold;
    color: #333;
  }
}
</style>
