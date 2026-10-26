<script setup lang="ts">
import { useUserStore } from '../store/user'

const userStore = useUserStore()
</script>

<template>
  <NuxtLink
    class="user-widget"
    :aria-label="`Открыть профиль: ${userStore.user.name}`"
    to="/profile"
  >
    <div class="user-widget__avatar">
      <img
        :src="userStore.user.avatar"
        :alt="userStore.user.name"
      >
    </div>
    <span class="user-widget__name">{{ userStore.user.name }}</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.user-widget {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #333;
  transition: color 0.2s;

  &:hover {
    color: #666;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__name {
    font-weight: 500;
  }
}
</style>
