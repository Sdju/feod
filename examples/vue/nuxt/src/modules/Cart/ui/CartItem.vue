<script setup lang="ts">
import MainButton from '@/common/ui/MainButton.vue'
import type { CartItem } from '../store/cart'

interface Props {
  item: CartItem
}

defineProps<Props>()

defineEmits<{
  (e: 'update:quantity', value: number): void
  (e: 'remove'): void
}>()
</script>

<template>
  <li class="cart-item">
    <img
      :src="item.image"
      :alt="item.title"
      class="cart-item__image"
    >

    <div class="cart-item__content">
      <h3 class="cart-item__title">
        {{ item.title }}
      </h3>
      <p class="cart-item__price">
        {{ item.price }} ₽
      </p>
    </div>

    <div class="cart-item__quantity">
      <MainButton
        variant="secondary"
        size="small"
        class="cart-item__quantity-btn"
        :aria-label="`Уменьшить количество: ${item.title}`"
        @click="$emit('update:quantity', item.quantity - 1)"
      >
        -
      </MainButton>
      <span class="cart-item__quantity-value">{{ item.quantity }}</span>
      <MainButton
        variant="secondary"
        size="small"
        class="cart-item__quantity-btn"
        :aria-label="`Увеличить количество: ${item.title}`"
        @click="$emit('update:quantity', item.quantity + 1)"
      >
        +
      </MainButton>
    </div>

    <div class="cart-item__total">
      {{ item.price * item.quantity }} ₽
    </div>

    <MainButton
      variant="danger"
      size="small"
      :aria-label="`Удалить товар: ${item.title}`"
      @click="$emit('remove')"
    >
      Удалить
    </MainButton>
  </li>
</template>

<style scoped lang="scss">
.cart-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  gap: 24px;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &__image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 4px;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
  }

  &__price {
    margin: 0;
    color: #666;
  }

  &__quantity {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__quantity-btn {
    min-width: 32px !important;
    width: 32px;
    padding: 0 !important;
  }

  &__quantity-value {
    min-width: 24px;
    text-align: center;
  }

  &__total {
    font-weight: bold;
    font-size: 18px;
  }
}

@media (max-width: 700px) {
  .cart-item {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 16px;

    &__content {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    &__quantity {
      grid-column: 1 / -1;
    }
  }
}
</style>
