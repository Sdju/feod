<script setup lang="ts">
import { useCartStore } from '../store/cart'
import CartItem from './CartItem.vue'
import MainButton from '@/common/ui/MainButton.vue'

const cartStore = useCartStore()
</script>

<template>
  <div class="cart-view">
    <h1 class="cart-view__title">
      Корзина
    </h1>

    <div
      v-if="cartStore.items.length"
      class="cart-view__content"
    >
      <ul class="cart-items">
        <CartItem
          v-for="item in cartStore.items"
          :key="item.id"
          :item="item"
          @update:quantity="cartStore.updateQuantity(item.id, $event)"
          @remove="cartStore.removeItem(item.id)"
        />
      </ul>

      <div class="cart-summary">
        <div class="cart-summary__total">
          <span class="cart-summary__total-label">Итого:</span>
          <span class="cart-summary__total-value">{{ cartStore.totalAmount }} ₽</span>
        </div>
        <MainButton
          size="large"
          @click="cartStore.clearCart"
        >
          Оформить заказ
        </MainButton>
      </div>
    </div>

    <div
      v-else
      class="cart-view__empty"
    >
      <p>Ваша корзина пуста</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cart-view {
  &__title {
    margin-bottom: 32px;
    font-size: 32px;
    font-weight: bold;
  }

  &__empty {
    text-align: center;
    padding: 48px;
    background: #f5f5f5;
    border-radius: 8px;
  }
}

.cart-items {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
}

.cart-summary {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &__total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    font-size: 24px;
    font-weight: bold;
  }
}
</style>
