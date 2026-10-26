<script setup lang="ts">
import { useCartStore } from '../store/cart'

const cartStore = useCartStore()
</script>

<template>
  <NuxtLink
    class="cart-widget"
    aria-label="Открыть корзину"
    to="/cart"
  >
    <div class="cart-widget__icon">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 18C5.9 18 5.01 18.9 5.01 20C5.01 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20C9 18.9 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5.48C20.96 5.34 21 5.17 21 5C21 4.45 20.55 4 20 4H5.21L4.27 2H1ZM17 18C15.9 18 15.01 18.9 15.01 20C15.01 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div
      v-if="cartStore.itemsCount"
      class="cart-widget__counter"
    >
      {{ cartStore.itemsCount }}
    </div>
    <span class="cart-widget__total">{{ cartStore.totalAmount }} ₽</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.cart-widget {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #333;
  transition: color 0.2s;
  position: relative;

  &:hover {
    color: #666;
  }

  &__icon {
    position: relative;
  }

  &__counter {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #4CAF50;
    color: white;
    font-size: 12px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
  }

  &__total {
    font-weight: 500;
  }
}
</style>
