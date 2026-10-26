<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

import { useRouter } from 'vue-router'

const layouts = {
  default: defineAsyncComponent(() => import('../layout/default.vue')),
  clear: defineAsyncComponent(() => import('../layout/clear.vue')),
}

const router = useRouter()
const currentLayout = computed<keyof typeof layouts>(() => {
  const metaLayout = router.currentRoute.value.meta.layout
  return typeof metaLayout === 'string' && metaLayout in layouts
    ? (metaLayout as keyof typeof layouts)
    : 'default'
})
const currentLayoutComponent = computed(() => layouts[currentLayout.value])
</script>

<template>
  <component :is="currentLayoutComponent">
    <slot />
  </component>
</template>
