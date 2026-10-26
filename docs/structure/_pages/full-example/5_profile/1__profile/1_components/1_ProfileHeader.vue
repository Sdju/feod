<script setup lang="ts">
import type { Profile } from '../api/profileApi'
defineProps<{ user: Profile }>()
</script>

<template>
  <header><h1>{{ user.name }}</h1><p>{{ user.email }}</p></header>
</template>
