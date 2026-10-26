<script setup lang="ts">
import type { NuxtError } from '#app'
import MainButton from '@/common/ui/MainButton.vue'

const props = defineProps<{ error: NuxtError }>()
const title = computed(() => props.error.statusCode === 404 ? 'Страница не найдена' : 'Что-то пошло не так')

useHead({ title })
</script>

<template>
  <NuxtLayout>
    <section class="error-page">
      <h1>{{ title }}</h1>
      <p v-if="error.statusCode === 404 && error.statusMessage && error.statusMessage !== 'Page Not Found'">
        {{ error.statusMessage }}
      </p>
      <MainButton @click="clearError({ redirect: '/' })">
        На главную
      </MainButton>
    </section>
  </NuxtLayout>
</template>
