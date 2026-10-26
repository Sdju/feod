<template>
  <button type="button" :class="['button', `button--${variant}`]">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'danger'
}>(), { variant: 'default' })
</script>
