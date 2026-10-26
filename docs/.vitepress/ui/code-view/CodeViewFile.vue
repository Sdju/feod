<template>
  <div
    v-if="isActive"
    class="code-view-file"
  >
    <div
      class="code-view-file__content"
      :class="{ 'code-view-file__content--annotated': props.annotations.length > 0 }"
      ref="contentRef"
    >
      <slot />
      <div
        v-for="(annotation, index) in annotations"
        :key="`annotation-${index}`"
        class="code-view-file__annotation-marker"
        :style="getMarkerStyle(index)"
        @mouseenter="(e) => showTooltip(e, annotation, index)"
        @mouseleave="hideTooltip"
        @click.stop="(e) => toggleTooltip(e, annotation, index)"
      >
        <span class="code-view-file__marker-icon" :style="{ color: getMarkerColor(annotation.marker) }">
          <component
            v-if="getMarkerComponent(annotation.marker)"
            :is="getMarkerComponent(annotation.marker)"
            aria-hidden="true"
          />
          <span v-else>{{ annotation.marker || 'ℹ️' }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { injectTooltip } from '../tooltip'
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
  /** Цвет подсветки строки (CSS цвет, например '#10b981' или 'rgba(16, 185, 129, 0.2)') */
  color?: string
}

interface Props {
  /** Имя файла */
  name: string
  /** Путь к файлу (опционально) */
  path?: string
  /** Язык программирования для подсветки синтаксиса */
  language?: string
  /** Индекс файла (для управления активностью, опционально) */
  index?: number
  /** Массив аннотаций для строк кода */
  annotations?: Annotation[]
}

const props = withDefaults(defineProps<Props>(), {
  annotations: () => []
})

const registerFile = inject<(name: string, language?: string) => number>('registerFile')
const activeFileIndex = inject<{ value: number }>('activeFileIndex', { value: -1 })

const fileIndex = ref<number>(props.index ?? -1)

onMounted(() => {
  if (fileIndex.value === -1 && registerFile) {
    fileIndex.value = registerFile(props.name, props.language)
  }
})

const isActive = computed(() => {
  if (fileIndex.value === -1) return false
  return activeFileIndex.value === fileIndex.value
})

const contentRef = ref<HTMLElement | null>(null)
const markerStyles = ref<Record<number, { top: string; transform: string }>>({})
const lineElementsMap = ref<Map<number, HTMLElement>>(new Map())
let currentTooltipIndex: number | null = null

// Маппинг маркеров к цветам подсветки
const markerColorMap: Record<string, string> = {
  // Info / Information
  'ℹ️': 'rgba(59, 130, 246, 0.2)', // blue-500
  'ℹ': 'rgba(59, 130, 246, 0.2)',
  'i': 'rgba(59, 130, 246, 0.2)',
  'I': 'rgba(59, 130, 246, 0.2)',
  'info': 'rgba(59, 130, 246, 0.2)',
  
  // Warning
  '⚠️': 'rgba(245, 158, 11, 0.2)', // amber-500
  '⚠': 'rgba(245, 158, 11, 0.2)',
  'warn': 'rgba(245, 158, 11, 0.2)',
  'warning': 'rgba(245, 158, 11, 0.2)',
  
  // Error / Danger
  '❌': 'rgba(239, 68, 68, 0.2)', // red-500
  '❌️': 'rgba(239, 68, 68, 0.2)',
  '✖': 'rgba(239, 68, 68, 0.2)',
  '✖️': 'rgba(239, 68, 68, 0.2)',
  'error': 'rgba(239, 68, 68, 0.2)',
  'danger': 'rgba(239, 68, 68, 0.2)',
  
  // Success / Check
  '✅': 'rgba(16, 185, 129, 0.2)', // emerald-500 (malachite)
  '✓': 'rgba(16, 185, 129, 0.2)',
  '✓️': 'rgba(16, 185, 129, 0.2)',
  '✔': 'rgba(16, 185, 129, 0.2)',
  '✔️': 'rgba(16, 185, 129, 0.2)',
  'success': 'rgba(16, 185, 129, 0.2)',
  'check': 'rgba(16, 185, 129, 0.2)',
  
  // Idea / Lightbulb
  '💡': 'rgba(251, 191, 36, 0.2)', // yellow-400
  'idea': 'rgba(251, 191, 36, 0.2)',
  'lightbulb': 'rgba(251, 191, 36, 0.2)',
  'tip': 'rgba(251, 191, 36, 0.2)',
  
  // Question
  '❓': 'rgba(139, 92, 246, 0.2)', // violet-500
  '❓️': 'rgba(139, 92, 246, 0.2)',
  '?': 'rgba(139, 92, 246, 0.2)',
  'question': 'rgba(139, 92, 246, 0.2)',
  
  // Search / Find
  '🔍': 'rgba(168, 85, 247, 0.2)', // purple-500
  '🔎': 'rgba(168, 85, 247, 0.2)',
  'search': 'rgba(168, 85, 247, 0.2)',
  'find': 'rgba(168, 85, 247, 0.2)',
  
  // Star / Important
  '⭐': 'rgba(251, 191, 36, 0.2)', // yellow-400
  '🌟': 'rgba(251, 191, 36, 0.2)',
  'star': 'rgba(251, 191, 36, 0.2)',
  'important': 'rgba(251, 191, 36, 0.2)',
  
  // Fire / Hot
  '🔥': 'rgba(249, 115, 22, 0.2)', // orange-500
  'hot': 'rgba(249, 115, 22, 0.2)',
  'fire': 'rgba(249, 115, 22, 0.2)',
  
  // Rocket / New
  '🚀': 'rgba(59, 130, 246, 0.2)', // blue-500
  'rocket': 'rgba(59, 130, 246, 0.2)',
  'new': 'rgba(59, 130, 246, 0.2)',
  
  // Lock / Security
  '🔒': 'rgba(34, 197, 94, 0.2)', // green-500
  '🔐': 'rgba(34, 197, 94, 0.2)',
  'lock': 'rgba(34, 197, 94, 0.2)',
  'security': 'rgba(34, 197, 94, 0.2)',
  
  // Bug / Bugfix
  '🐛': 'rgba(239, 68, 68, 0.2)', // red-500
  'bug': 'rgba(239, 68, 68, 0.2)',
  
  // Performance
  '⚡': 'rgba(251, 191, 36, 0.2)', // yellow-400
  'performance': 'rgba(251, 191, 36, 0.2)',
  'fast': 'rgba(251, 191, 36, 0.2)',
  'bolt': 'rgba(251, 191, 36, 0.2)',
  'note': 'rgba(148, 163, 184, 0.2)'
}

const markerIconColorMap: Record<string, string> = {
  info: '#3b82f6',
  check: '#10b981',
  tip: '#fbbf24',
  bolt: '#fbbf24',
  warn: '#f59e0b',
  note: '#94a3b8'
}

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

function getMarkerColor(marker?: string) {
  const raw = markerAliases[marker || ''] || marker || 'info'
  const key = raw.toString().toLowerCase()
  return markerIconColorMap[key] || markerIconColorMap.info
}

// Функция для получения цвета на основе маркера
function getColorByMarker(marker?: string, customColor?: string): string {
  // Если цвет указан вручную, используем его
  if (customColor) {
    return customColor
  }
  
  // Если маркер не указан, используем цвет по умолчанию
  if (!marker) {
    return 'rgba(16, 185, 129, 0.2)' // emerald-500 (malachite) - цвет по умолчанию
  }
  
  // Проверяем маппинг напрямую (для эмодзи важно точное совпадение)
  if (markerColorMap[marker]) {
    return markerColorMap[marker]
  }
  
  // Нормализуем маркер (убираем пробелы, приводим к нижнему регистру для текстовых маркеров)
  const normalizedMarker = marker.trim().toLowerCase()
  
  if (markerColorMap[normalizedMarker]) {
    return markerColorMap[normalizedMarker]
  }
  
  return 'rgba(16, 185, 129, 0.2)' // emerald-500 (malachite) - default
}


let tooltipManager: ReturnType<typeof injectTooltip> | null = null
try {
  tooltipManager = injectTooltip()
} catch {
  // Tooltip manager не доступен
}

function getMarkerTop(lineElement: HTMLElement, container: HTMLElement): number {
  const lineRect = lineElement.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  return lineRect.top - containerRect.top + container.scrollTop + lineRect.height / 2
}

function prepareCodeLines(codeElement: HTMLElement) {
  Array.from(codeElement.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      codeElement.removeChild(node)
    }
  })

  codeElement.querySelectorAll(':scope > br').forEach((br) => br.remove())
}

// Обновляем позиции маркеров на основе реальных DOM элементов
async function updateMarkerPositions() {
  await nextTick()
  if (!contentRef.value) return
  
  const preElement = contentRef.value.querySelector('pre')
  if (!preElement) return
  
  const codeElement = preElement.querySelector('code')
  if (!codeElement) return

  prepareCodeLines(codeElement)
  await nextTick()
  
  const lineElements = codeElement.querySelectorAll(':scope > span.line')
  if (lineElements.length === 0) return
  
  const newStyles: Record<number, { top: string; transform: string }> = {}
  const newLineElementsMap = new Map<number, HTMLElement>()
  
  props.annotations.forEach((annotation, index) => {
    const lineIndex = annotation.line - 1
    if (lineIndex < 0 || lineIndex >= lineElements.length) return
    
    const lineElement = lineElements[lineIndex] as HTMLElement
    if (!lineElement) return
    
    newLineElementsMap.set(index, lineElement)
  })

  lineElementsMap.value = newLineElementsMap

  // Сначала подсветка — layout annotated-строк должен быть финальным до измерений
  applyAllHighlights()
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  const container = contentRef.value
  // The active file may have been unmounted while waiting for layout or HMR.
  if (!container || !container.contains(codeElement)) return

  props.annotations.forEach((_, index) => {
    const lineElement = newLineElementsMap.get(index)
    if (!lineElement) return

    newStyles[index] = {
      top: `${getMarkerTop(lineElement, container)}px`,
      transform: 'translateY(-50%)'
    }
  })
  
  markerStyles.value = newStyles
}

function getMarkerStyle(index: number) {
  return markerStyles.value[index] || { top: '0px', transform: 'translateY(-50%)' }
}

// Применяем подсветку ко всем строкам с аннотациями
function applyAllHighlights() {
  props.annotations.forEach((annotation, index) => {
    highlightLine(index, annotation)
  })
}

function highlightLine(index: number, annotation: Annotation) {
  const lineElement = lineElementsMap.value.get(index)
  if (!lineElement) return
  
  const highlightColor = getColorByMarker(annotation.marker, annotation.color)
  const borderColor = highlightColor.replace('0.2)', '0.6)')
  
  lineElement.classList.add('code-view-file__line--highlighted')
  lineElement.style.setProperty('--highlight-color', highlightColor)
  lineElement.style.setProperty('--highlight-border-color', borderColor)
}

function unhighlightLine(index: number) {
  const lineElement = lineElementsMap.value.get(index)
  if (!lineElement) return
  
  lineElement.classList.remove('code-view-file__line--highlighted')
  lineElement.style.removeProperty('--highlight-color')
  lineElement.style.removeProperty('--highlight-border-color')
}

function showTooltip(event: MouseEvent, annotation: Annotation, index: number) {
  if (!tooltipManager) return
  
  const target = event.currentTarget as HTMLElement
  if (!target) return
  
  const rect = target.getBoundingClientRect()
  tooltipManager.showTooltip({
    content: annotation.content,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    position: annotation.position || 'top',
    targetElement: target
  })
  
  currentTooltipIndex = index
}

function hideTooltip() {
  if (!tooltipManager) return
  if (currentTooltipIndex === null) return
  
  // Строка остается подсвеченной постоянно, не нужно убирать подсветку
  tooltipManager.hideTooltip()
  currentTooltipIndex = null
}

function toggleTooltip(event: MouseEvent, annotation: Annotation, index: number) {
  if (currentTooltipIndex === index) {
    hideTooltip()
  } else {
    // Строки подсвечены постоянно, не нужно управлять подсветкой
    showTooltip(event, annotation, index)
  }
}

let observer: ResizeObserver | null = null

const handleScroll = () => {
  updateMarkerPositions()
}

onMounted(() => {
  updateMarkerPositions()
  
  if (contentRef.value) {
    observer = new ResizeObserver(() => {
      updateMarkerPositions()
    })
    observer.observe(contentRef.value)
    
    const preElement = contentRef.value.querySelector('pre')
    if (preElement) {
      observer.observe(preElement)
    }

    contentRef.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  lineElementsMap.value.forEach((_, index) => {
    unhighlightLine(index)
  })
  
  if (observer) {
    observer.disconnect()
    observer = null
  }

  if (contentRef.value) {
    contentRef.value.removeEventListener('scroll', handleScroll)
  }
})

// Пересчитываем при изменении аннотаций
watch(() => props.annotations, () => {
  // Убираем подсветку всех строк перед обновлением
  lineElementsMap.value.forEach((_, index) => {
    unhighlightLine(index)
  })
  
  updateMarkerPositions()
  // Подсветка будет применена автоматически в updateMarkerPositions через applyAllHighlights
  
  // Скрываем тултип при изменении аннотаций
  if (tooltipManager && currentTooltipIndex !== null) {
    hideTooltip()
  }
}, { deep: true })

watch(isActive, (newValue) => {
  if (newValue) {
    nextTick(() => {
      updateMarkerPositions()
    })
  } else {
    lineElementsMap.value.forEach((_, index) => {
      unhighlightLine(index)
    })
    if (tooltipManager && currentTooltipIndex !== null) {
      hideTooltip()
    }
  }
})

</script>

<style scoped>
.code-view-file {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.code-view-file__content {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  min-width: 0;
  min-height: 0;
  height: 100%;
  position: relative;
  background: var(--vp-code-block-bg);
}

/* Переопределяем стили VitePress для блоков кода */
.code-view-file__content :deep(.vp-code-group),
.code-view-file__content :deep(.vp-code-group .tabs),
.code-view-file__content :deep(.vp-code-group .blocks) {
  margin: 0;
  padding: 0;
}

.code-view-file__content > :deep(div:not(.code-view-file__annotation-marker)) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  height: 100%;
  background: transparent;
}

.code-view-file__content :deep(div[class*='language-']) {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 100%;
  height: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  background: var(--vp-code-block-bg);
}

.code-view-file__content :deep(div[class*='language-'].line-numbers-mode) {
  padding-left: 32px;
}

.code-view-file__content :deep(.line-numbers-wrapper) {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  width: 32px;
  padding-top: 1rem;
  border-right: 1px solid var(--vp-c-divider);
  background: var(--vp-code-block-bg);
  text-align: center;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--vp-code-line-number-color, var(--vp-c-text-3));
  pointer-events: none;
  user-select: none;
}

.code-view-file__content :deep(pre) {
  margin: 0 !important;
  padding: 1rem;
  background: var(--vp-code-block-bg);
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  overflow-y: visible;
  tab-size: 2;
  border-radius: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100%;
  height: 100%;
  flex: 1 1 auto;
  align-self: stretch;
  box-sizing: border-box;
}

.code-view-file__content :deep(pre code) {
  font-family: inherit;
  color: inherit;
  background: transparent;
  padding: 0;
  border-radius: 0;
  margin: 0;
  display: block;
  width: max-content;
  min-width: 100%;
  box-sizing: border-box;
  font-size: 0;
  line-height: 0;
}

.code-view-file__content :deep(pre code span.line) {
  display: block;
  font-size: 0.875rem;
  line-height: 1.6;
  min-height: calc(0.875rem * 1.6);
  box-sizing: border-box;
}

.code-view-file__content--annotated {
  --code-view-marker-gutter: 3rem;
}

.code-view-file__content--annotated :deep(pre code) {
  padding-right: var(--code-view-marker-gutter);
}

/* Убираем отступы у div'ов, которые могут оборачивать код */
.code-view-file__content :deep(div) {
  margin: 0;
}

.code-view-file__content :deep(div > pre) {
  margin: 0 !important;
}

/* Убираем отступы у первого и последнего элементов */
.code-view-file__content :deep(> *:first-child) {
  margin-top: 0 !important;
  padding-top: 0;
}

.code-view-file__content :deep(> *:last-child) {
  margin-bottom: 0 !important;
}

/* Убираем отступы у всех прямых дочерних элементов */
.code-view-file__content :deep(> *) {
  margin-top: 0;
  margin-bottom: 0;
}

/* Стили для аннотаций */
.code-view-file__annotation-marker {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  cursor: help;
  z-index: 10;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  pointer-events: auto;
}

.code-view-file__annotation-marker:hover {
  opacity: 1;
}

.code-view-file__marker-icon {
  width: 1.50rem;
  height: 1.50rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  background: rgba(10, 10, 12);
  border-radius: 999px;
  padding: 0.12rem;
}

:root[data-theme="light"] .code-view-file__marker-icon,
:root:not(.dark):not([data-theme="dark"]) .code-view-file__marker-icon {
  background: rgba(255, 255, 255);
  border-color: rgba(15, 23, 42);
}

.code-view-file__marker-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.code-view-file__content :deep(pre code span.line.code-view-file__line--highlighted) {
  position: relative;
  background-color: transparent;
  isolation: isolate;
  transition: color 0.2s ease;
}

.code-view-file__content :deep(pre code span.line.code-view-file__line--highlighted::before) {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -1rem;
  right: -1rem;
  background-color: var(--highlight-color, rgba(16, 185, 129, 0.2));
  border-left: 3px solid var(--highlight-border-color, rgba(16, 185, 129, 0.6));
  z-index: -1;
  pointer-events: none;
  transition: background-color 0.2s ease, border-left-color 0.2s ease;
}

.code-view-file__content--annotated :deep(pre code span.line.code-view-file__line--highlighted::before) {
  right: calc(-1rem - var(--code-view-marker-gutter));
}
</style>
