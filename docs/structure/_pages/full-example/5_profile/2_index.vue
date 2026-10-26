<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ProfileHeader, ProfileForm, fetchProfile, type Profile } from './_profile'

const user = ref<Profile | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
onMounted(async () => {
  try {
    user.value = await fetchProfile()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить профиль'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="error" role="alert">{{ error }}</p>
  <section v-else-if="user">
    <ProfileHeader :user="user" />
    <ProfileForm :user="user" @update="user = $event" />
  </section>
</template>
