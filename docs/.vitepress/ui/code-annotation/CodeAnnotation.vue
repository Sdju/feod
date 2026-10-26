<template>
  <span
    ref="markerRef"
    class="code-annotation"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @click.stop="toggleTooltip"
  >
    <span class="code-annotation__marker">
      <component v-if="markerComponent" :is="markerComponent" aria-hidden="true" />
      <span v-else>{{ marker }}</span>
    </span>
    <span class="code-annotation__underline"></span>
    <span ref="slotContentRef" class="code-annotation__slot-content">
      <slot />
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { injectTooltip } from '../tooltip'
import IconInfo from '~icons/lucide/info'
import IconCheck from '~icons/lucide/check'
import IconLightbulb from '~icons/lucide/lightbulb'
import IconZap from '~icons/lucide/zap'
import IconAlertTriangle from '~icons/lucide/alert-triangle'
import IconFileText from '~icons/lucide/file-text'

interface Props {
  /** Текст маркера (иконка или символ) */
  marker?: string
  /** Позиция tooltip относительно маркера */
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  marker: 'info',
  position: 'top'
})

const markerMap: Record<string, any> = {
  info: IconInfo,
  check: IconCheck,
  tip: IconLightbulb,
  bolt: IconZap,
  warn: IconAlertTriangle,
  note: IconFileText
}

const markerAliases: Record<string, string> = {
  'ℹ️': 'info',
  '✅': 'check',
  '💡': 'tip',
  '⚡': 'bolt',
  '⚠️': 'warn',
  '📝': 'note'
}

const markerComponent = computed(() => {
  const raw = markerAliases[props.marker] || props.marker || ''
  const key = raw.toString().toLowerCase()
  return markerMap[key] || null
})

const markerRef = ref<HTMLElement | null>(null)
const slotContentRef = ref<HTMLElement | null>(null)

let tooltipManager: ReturnType<typeof injectTooltip> | null = null
try {
  tooltipManager = injectTooltip()
} catch {
  // Tooltip manager не доступен
}

function showTooltip(event: MouseEvent) {
  if (!tooltipManager || !markerRef.value) return
  
  const rect = markerRef.value.getBoundingClientRect()
  const content = slotContentRef.value?.innerHTML || ''
  
  tooltipManager.showTooltip({
    content,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    position: props.position,
    targetElement: markerRef.value
  })
}

function hideTooltip() {
  if (!tooltipManager) return
  tooltipManager.hideTooltip()
}

function toggleTooltip(event: MouseEvent) {
  if (!tooltipManager) return
  
  if (tooltipManager.tooltip.value && tooltipManager.tooltip.value.targetElement === markerRef.value) {
    hideTooltip()
  } else {
    showTooltip(event)
  }
}

</script>

<style scoped>
.code-annotation {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin: 0 0.25rem;
  cursor: help;
  vertical-align: baseline;
}

.code-annotation__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.95em;
  height: 0.95em;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  user-select: none;
}

.code-annotation__marker :deep(svg) {
  width: 100%;
  height: 100%;
}

.code-annotation:hover .code-annotation__marker {
  opacity: 1;
}

.code-annotation__underline {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.code-annotation:hover .code-annotation__underline {
  opacity: 0.6;
}

.code-annotation__slot-content {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
}
</style>
