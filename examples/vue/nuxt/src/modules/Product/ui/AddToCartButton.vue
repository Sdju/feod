<script setup lang="ts">
import { computed } from 'vue'
import MainButton from '@/common/ui/MainButton.vue'
import { useCartStore } from '@/modules/Cart'
import type { Product } from '../types'

const props = defineProps<{ product: Product }>()
const cartStore = useCartStore()

const isInCart = computed(() => cartStore.items.some(item => item.id === props.product.id))
</script>

<template>
  <MainButton
    :variant="isInCart ? 'secondary' : 'primary'"
    :disabled="isInCart"
    @click="cartStore.addItem(product)"
  >
    {{ isInCart ? 'В корзине' : 'В корзину' }}
  </MainButton>
</template>
