<script setup lang="ts">
import { ref, watch } from 'vue'
import { updateProfile, type Profile } from '../api/profileApi'
const props = defineProps<{ user: Profile }>()
const emit = defineEmits<{ update: [user: Profile] }>()
const name = ref(props.user.name)
const saving = ref(false)
const error = ref<string | null>(null)
watch(() => props.user.name, value => { name.value = value })

async function save() {
  if (saving.value) return
  saving.value = true
  error.value = null
  try {
    emit('update', await updateProfile(name.value))
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось сохранить профиль'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form @submit.prevent="save">
    <label>Имя <input v-model="name" required /></label>
    <p v-if="error" role="alert">{{ error }}</p>
    <button :disabled="saving">Сохранить</button>
  </form>
</template>
