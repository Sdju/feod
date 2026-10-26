<template>
  <button
    :class="['btn', `btn--${variant}`, { 'btn--disabled': disabled }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>
