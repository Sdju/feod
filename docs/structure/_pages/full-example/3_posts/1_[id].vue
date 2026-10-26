<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePost } from '@/modules/Posts'

const route = useRoute()
const id = computed(() => String(route.params.id))
const { post, loading, error } = usePost(id)
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="error" role="alert">{{ error }}</p>
  <article v-else-if="post">
    <h1>{{ post.title }}</h1>
    <p>{{ post.content }}</p>
  </article>
</template>
