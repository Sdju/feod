<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ProductDetails, useProduct } from '@/modules/Products'

const route = useRoute()
const id = computed(() => String(route.params.id))
const { product, loading, error } = useProduct(id)
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="error" role="alert">{{ error }}</p>
  <ProductDetails v-else-if="product" :product="product" />
</template>
