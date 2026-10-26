<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useFramework } from '../composables/framework'
import IconVue from '~icons/devicon/vuejs'
import IconReact from '~icons/devicon/react'
import IconNuxt from '~icons/devicon/nuxt'
import IconNext from '~icons/devicon/nextjs'
import IconAngular from '~icons/devicon/angular'
import IconSvelte from '~icons/devicon/svelte'
import IconChevronDown from '~icons/lucide/chevron-down'
import IconAlertTriangle from '~icons/lucide/alert-triangle'
import { injectTooltip } from '../../ui/tooltip'

const { frameworks, framework, base, label, setFramework } = useFramework()
const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)
let tooltipManager: ReturnType<typeof injectTooltip> | null = null

try {
  tooltipManager = injectTooltip()
} catch {
  tooltipManager = null
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleSelect = (id: typeof framework.value) => {
  setFramework(id)
  closeMenu()
}

const iconMap = {
  vue: IconVue,
  react: IconReact,
  nuxt: IconNuxt,
  next: IconNext,
  angular: IconAngular,
  svelte: IconSvelte,
  sveltekit: IconSvelte,
} as const

const getIcon = (id: typeof framework.value) => {
  return iconMap[id] || IconVue
}

const statusMap: Record<string, 'red' | 'yellow' | null> = {
  vue: null,
  react: 'red',
  angular: 'red',
  svelte: 'red',
  nuxt: 'yellow',
  next: 'red',
  sveltekit: 'red',
}

const getStatus = (id: typeof framework.value) => {
  if (!(id in statusMap)) {
    return null
  }
  return statusMap[id] ?? null
}

const getStatusLabel = (status: 'red' | 'yellow' | null) => {
  if (status === 'yellow') {
    return 'Реализация требует серьезной доработки'
  }
  if (status === 'red') {
    return 'Реализация не готова'
  }
  return ''
}

const showStatusTooltip = (event: MouseEvent, status: 'red' | 'yellow' | null) => {
  if (!tooltipManager || !status) return
  const target = event.currentTarget as HTMLElement
  if (!target) return
  const rect = target.getBoundingClientRect()
  tooltipManager.showTooltip({
    content: getStatusLabel(status),
    x: rect.left + rect.width / 2,
    y: rect.top,
    position: 'top',
    targetElement: target,
  })
}

const hideStatusTooltip = () => {
  if (!tooltipManager) return
  tooltipManager.hideTooltip()
}

const handleClickOutside = (event: MouseEvent) => {
  if (!root.value) return
  if (!root.value.contains(event.target as Node)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="framework-switcher" ref="root">
    <button
      class="framework-switcher__button"
      :data-open="isOpen ? 'true' : 'false'"
      type="button"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-haspopup="listbox"
      :aria-label="`Framework: ${label}`"
      @click="toggleMenu"
    >
      <span class="framework-switcher__icon framework-switcher__icon--current">
        <component :is="getIcon(framework)" />
      </span>
      <span class="framework-switcher__chevron">
        <IconChevronDown />
      </span>
    </button>
    <div
      v-show="isOpen"
      class="framework-switcher__menu"
      role="listbox"
    >
      <button
        v-for="option in frameworks"
        :key="option.id"
        class="framework-switcher__item"
        type="button"
        role="option"
        :aria-selected="framework === option.id"
        :data-active="framework === option.id"
        @click="handleSelect(option.id)"
      >
        <span class="framework-switcher__icon">
          <component :is="getIcon(option.id)" />
        </span>
        <span class="framework-switcher__label-text">{{ option.label }}</span>
        <span
          v-if="getStatus(option.id)"
          class="framework-switcher__status"
          :data-status="getStatus(option.id)"
          aria-hidden="true"
          @mouseenter="(event) => showStatusTooltip(event, getStatus(option.id))"
          @mouseleave="hideStatusTooltip"
        >
          <IconAlertTriangle />
        </span>
      </button>
    </div>
  </div>
</template>
