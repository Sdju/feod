<template>
  <div class="annotated-code">
    <div ref="wrapperRef" class="annotated-code__wrapper">
      <slot />
      <div
        v-for="(annotation, index) in annotations"
        :key="index"
        class="annotated-code__annotation-marker"
        :style="getMarkerStyle(annotation.line)"
        @mouseenter="showTooltip(index)"
        @mouseleave="hideTooltip(index)"
        @click.stop="toggleTooltip(index)"
      >
        <span class="annotated-code__marker-icon">
          <component
            v-if="getMarkerComponent(annotation.marker)"
            :is="getMarkerComponent(annotation.marker)"
            aria-hidden="true"
          />
          <span v-else>{{ annotation.marker || 'ℹ️' }}</span>
        </span>
        <Transition name="tooltip">
          <div
            v-if="visibleTooltips.has(index)"
            class="annotated-code__tooltip"
            :class="`annotated-code__tooltip--${annotation.position || 'top'}`"
          >
            <div class="annotated-code__tooltip-content" v-html="annotation.content"></div>
            <div class="annotated-code__tooltip-arrow"></div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import IconInfo from '~icons/lucide/info'
import IconCheck from '~icons/lucide/check'
import IconLightbulb from '~icons/lucide/lightbulb'
import IconZap from '~icons/lucide/zap'
import IconAlertTriangle from '~icons/lucide/alert-triangle'
import IconFileText from '~icons/lucide/file-text'

interface Annotation {
  /** Номер строки (начиная с 1) */
  line: number
  /** Содержимое tooltip (может быть HTML) */
  content: string
  /** Маркер/иконка (по умолчанию ℹ️) */
  marker?: string
  /** Позиция tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface Props {
  /** Массив аннотаций */
  annotations?: Annotation[]
  /** Высота строки в пикселях (для позиционирования) */
  lineHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  annotations: () => [],
  lineHeight: 24
})

const visibleTooltips = ref<Set<number>>(new Set())
const wrapperRef = ref<HTMLElement | null>(null)
const markerPositions = ref<Record<number, number>>({})
let resizeObserver: ResizeObserver | undefined

function measureLines() {
  const wrapper = wrapperRef.value
  if (!wrapper) return
  const lines = wrapper.querySelectorAll('pre code > .line')
  const wrapperTop = wrapper.getBoundingClientRect().top
  const positions: Record<number, number> = {}
  for (const annotation of props.annotations) {
    const line = lines[annotation.line - 1]
    if (!line) continue
    const rect = line.getBoundingClientRect()
    positions[annotation.line] = rect.top - wrapperTop + rect.height / 2
  }
  markerPositions.value = positions
}

onMounted(async () => {
  await nextTick()
  measureLines()
  resizeObserver = new ResizeObserver(measureLines)
  if (wrapperRef.value) resizeObserver.observe(wrapperRef.value)
})

watch(() => props.annotations, measureLines, { deep: true, flush: 'post' })
onUnmounted(() => resizeObserver?.disconnect())

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

function getMarkerComponent(marker?: string) {
  if (!marker) return markerMap.info
  const raw = markerAliases[marker] || marker || ''
  const key = raw.toString().toLowerCase()
  return markerMap[key] || null
}

function getMarkerStyle(line: number) {
  return {
    top: `${markerPositions.value[line] ?? ((line - 1) * props.lineHeight + props.lineHeight / 2)}px`,
    transform: 'translateY(-50%)'
  }
}

function showTooltip(index: number) {
  visibleTooltips.value.add(index)
}

function hideTooltip(index: number) {
  visibleTooltips.value.delete(index)
}

function toggleTooltip(index: number) {
  if (visibleTooltips.value.has(index)) {
    hideTooltip(index)
  } else {
    showTooltip(index)
  }
}
</script>

<style scoped>
.annotated-code {
  position: relative;
}

.annotated-code__wrapper {
  position: relative;
}

.annotated-code__annotation-marker {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  cursor: help;
  z-index: 10;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.annotated-code__annotation-marker:hover {
  opacity: 1;
}

.annotated-code__marker-icon {
  width: 0.95rem;
  height: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.annotated-code__marker-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.annotated-code__tooltip {
  position: absolute;
  z-index: 1000;
  min-width: 200px;
  max-width: 400px;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--vp-c-text-1);
  pointer-events: auto;
}

.annotated-code__tooltip--top {
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
}

.annotated-code__tooltip--bottom {
  top: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
}

.annotated-code__tooltip--left {
  right: calc(100% + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
}

.annotated-code__tooltip--right {
  left: calc(100% + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
}

.annotated-code__tooltip-content {
  position: relative;
  z-index: 1;
}

.annotated-code__tooltip-content :deep(p) {
  margin: 0 0 0.5rem 0;
}

.annotated-code__tooltip-content :deep(p:last-child) {
  margin-bottom: 0;
}

.annotated-code__tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.annotated-code__tooltip--top .annotated-code__tooltip-arrow {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px 6px 0 6px;
  border-color: var(--vp-c-bg) transparent transparent transparent;
}

.annotated-code__tooltip--bottom .annotated-code__tooltip-arrow {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 6px 6px;
  border-color: transparent transparent var(--vp-c-bg) transparent;
}

.annotated-code__tooltip--left .annotated-code__tooltip-arrow {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 0 6px 6px;
  border-color: transparent transparent transparent var(--vp-c-bg);
}

.annotated-code__tooltip--right .annotated-code__tooltip-arrow {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 6px 6px 0;
  border-color: transparent var(--vp-c-bg) transparent transparent;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-enter-from {
  opacity: 0;
  transform: translateY(-4px) translateX(-50%);
}

.tooltip-leave-to {
  opacity: 0;
  transform: translateY(-4px) translateX(-50%);
}
</style>
