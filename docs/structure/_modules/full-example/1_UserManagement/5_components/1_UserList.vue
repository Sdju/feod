<template>
  <div class="user-list">
    <UserCard
      v-for="user in users"
      :key="user.id"
      :user="user"
    />
  </div>
</template>

<script setup lang="ts">
import UserCard from './UserCard.vue'
import type { User } from '../types/user.types'

defineProps<{
  users: User[]
}>()
</script>
