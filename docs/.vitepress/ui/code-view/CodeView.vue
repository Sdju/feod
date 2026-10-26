<template>
  <div
    ref="rootRef"
    class="code-view"
    :class="{
      'code-view--expanded': isExpanded,
      'code-view--dragging': isDragging,
      'code-view--mobile': isMobile,
      'code-view--no-tabs': !hasTabs,
      'code-view--mobile-sidebar': isMobile && mobilePanel === 'sidebar',
      'code-view--mobile-content': isMobile && mobilePanel === 'content'
    }"
    :style="{ '--code-view-sidebar-width': `${sidebarWidth}px` }"
  >
    <div v-if="isExpanded" class="code-view__backdrop" @click="toggleExpanded" />
    <div class="code-view__surface">
      <div class="code-view__sidebar">
        <div v-if="isMobile" class="code-view__sidebar-header">
          <button
            v-if="hasTabs"
            class="code-view__panel-toggle"
            type="button"
            aria-label="Показать код"
            @click="showContentPanel"
          >
            <component :is="IconCode" aria-hidden="true" />
          </button>
          <button
            class="code-view__expand"
            type="button"
            :aria-expanded="isExpanded ? 'true' : 'false'"
            :title="isExpanded ? 'Свернуть' : 'Развернуть'"
            @click="toggleExpanded"
          >
            <component :is="isExpanded ? IconMinimize : IconMaximize" aria-hidden="true" />
          </button>
        </div>
        <slot name="sidebar" />
      </div>
      <div
        class="code-view__divider"
        role="separator"
        aria-orientation="vertical"
        @pointerdown="startResize"
      ></div>
      <div class="code-view__content">
      <div class="code-view__tabs" v-if="hasTabs">
        <div class="code-view__tabs-scroll">
          <button
            v-if="isMobile"
            class="code-view__panel-toggle"
            type="button"
            aria-label="Показать список файлов"
            @click="showSidebarPanel"
          >
            <component :is="IconFileText" aria-hidden="true" />
          </button>
          <button
            v-for="file in files"
            :key="file.index"
            class="code-view__tab"
            :class="{ 'code-view__tab--active': activeFileIndex === file.index }"
            @click="handleTabClick(file.index, $event)"
            @dblclick="closeFile(file.index)"
            @auxclick="handleAuxClick(file.index, $event)"
          >
            <span class="code-view__tab-icon">
              <component :is="getFileIconComponent(file.name)" aria-hidden="true" />
            </span>
            <span class="code-view__tab-name">{{ file.name }}</span>
            <div
              class="code-view__tab-close"
              @click.stop="closeFile(file.index)"
              role="button"
              tabindex="0"
              aria-label="Закрыть файл"
              title="Закрыть файл"
              @keydown.enter="closeFile(file.index)"
              @keydown.space.prevent="closeFile(file.index)"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M4 4l8 8M12 4l-8 8"/>
              </svg>
            </div>
          </button>
        </div>
        <button
          class="code-view__expand"
          type="button"
          :aria-expanded="isExpanded ? 'true' : 'false'"
          :title="isExpanded ? 'Свернуть' : 'Развернуть'"
          @click="toggleExpanded"
        >
          <component :is="isExpanded ? IconMinimize : IconMaximize" aria-hidden="true" />
        </button>
      </div>
      <button
        v-else
        class="code-view__expand code-view__expand--standalone"
        type="button"
        :aria-expanded="isExpanded ? 'true' : 'false'"
        :title="isExpanded ? 'Свернуть' : 'Развернуть'"
        @click="toggleExpanded"
      >
        <component :is="isExpanded ? IconMinimize : IconMaximize" aria-hidden="true" />
      </button>
      <div v-if="!hasTabs && isMobile" class="code-view__content-header">
        <button
          class="code-view__panel-toggle"
          type="button"
          @click="showSidebarPanel"
          aria-label="Показать список файлов"
        >
          <component :is="IconFileText" aria-hidden="true" />
        </button>
      </div>
      <div class="code-view__editor">
        <div v-if="!hasTabs" class="code-view__empty">
          <p class="code-view__empty-text">Выберите файл в дереве слева</p>
        </div>
        <slot />
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import IconFile from '~icons/lucide/file'
import IconVue from '~icons/devicon/vuejs'
import IconTypeScript from '~icons/devicon/typescript'
import IconJavaScript from '~icons/devicon/javascript'
import IconHtml from '~icons/devicon/html5'
import IconCss from '~icons/devicon/css3'
import IconJson from '~icons/devicon/json'
import IconMarkdown from '~icons/devicon/markdown'
import IconImage from '~icons/lucide/image'
import IconMaximize from '~icons/lucide/maximize-2'
import IconMinimize from '~icons/lucide/minimize-2'
import IconFileText from '~icons/lucide/file-text'
import IconCode from '~icons/lucide/code'

interface Props {
  /** Начальный активный файл (индекс) */
  defaultActiveIndex?: number
  /** Имена файлов, которые должны быть открыты по умолчанию */
  defaultOpenFiles?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  defaultActiveIndex: 0,
  defaultOpenFiles: () => []
})

const rootRef = ref<HTMLElement | null>(null)
const activeFileIndex = ref<number>(-1)
const isExpanded = ref(false)
const isDragging = ref(false)
const fileCounter = ref(0)
const openFiles = ref<Set<number>>(new Set())
const registeredFiles = ref<Map<number, { name: string; language: string }>>(new Map())
const sidebarWidth = useStorage('feod-code-view-sidebar-width', 240)
const minSidebarWidth = 180
const minContentWidth = 360
const isMobile = ref(false)
const mobilePanel = ref<'sidebar' | 'content'>('sidebar')
let mediaQuery: MediaQueryList | null = null
let handleMediaChange: ((event: MediaQueryListEvent) => void) | null = null

const registerFile = (name: string, language?: string) => {
  const index = fileCounter.value++
  registeredFiles.value.set(index, { name, language: language || '' })
  return index
}

provide('registerFile', registerFile)
provide('activeFileIndex', activeFileIndex)

// Получаем список файлов из зарегистрированных
const allFiles = computed(() => {
  const entries: Array<[number, { name: string; language: string }]> = Array.from(registeredFiles.value.entries())
  return entries.map(([index, file]) => ({
    index,
    name: file.name,
    language: file.language
  }))
})

const files = computed(() => {
  return allFiles.value.filter(f => openFiles.value.has(f.index))
})

const activeFileName = computed(() => {
  const file = allFiles.value.find(f => f.index === activeFileIndex.value)
  return file?.name || null
})

const hasTabs = computed(() => {
  return openFiles.value.size > 0
})

function initializeDefaultFiles() {
  if (allFiles.value.length === 0) return
  
  // Открываем файлы по умолчанию
  if (props.defaultOpenFiles.length > 0) {
    allFiles.value.forEach(file => {
      if (props.defaultOpenFiles.includes(file.name)) {
        openFiles.value.add(file.index)
        if (activeFileIndex.value === -1) {
          activeFileIndex.value = file.index
        }
      }
    })
  }
  
  // Если есть defaultActiveIndex
  if (activeFileIndex.value === -1 && props.defaultActiveIndex >= 0 && allFiles.value[props.defaultActiveIndex]) {
    const file = allFiles.value[props.defaultActiveIndex]
    openFiles.value.add(file.index)
    activeFileIndex.value = file.index
  }
  
  // Если ничего не задано, открываем первый файл
  if (activeFileIndex.value === -1 && allFiles.value.length > 0) {
    const firstFile = allFiles.value[0]
    openFiles.value.add(firstFile.index)
    activeFileIndex.value = firstFile.index
  }
}

watch(() => allFiles.value.length, () => {
  if (activeFileIndex.value === -1) {
    initializeDefaultFiles()
  }
}, { immediate: true })

watch(activeFileIndex, (value) => {
  if (isMobile.value && value !== -1 && mobilePanel.value === 'sidebar') {
    mobilePanel.value = 'content'
  }
})

watch(hasTabs, (value) => {
  if (!value && isMobile.value) {
    mobilePanel.value = 'sidebar'
  }
})

onMounted(() => {
  nextTick(() => {
    initializeDefaultFiles()
  })
})

function getFileIconComponent(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, any> = {
    ts: IconTypeScript,
    tsx: IconTypeScript,
    js: IconJavaScript,
    jsx: IconJavaScript,
    vue: IconVue,
    css: IconCss,
    scss: IconCss,
    sass: IconCss,
    json: IconJson,
    md: IconMarkdown,
    html: IconHtml,
    svg: IconImage,
    png: IconImage,
    jpg: IconImage,
    jpeg: IconImage,
    gif: IconImage
  }
  return iconMap[ext || ''] || IconFile
}

function closeFile(fileIndex: number) {
  // Удаляем файл из открытых
  openFiles.value.delete(fileIndex)
  
  // Если закрываем активный файл, переключаемся на другой открытый
  if (activeFileIndex.value === fileIndex) {
    if (openFiles.value.size > 0) {
      // Переключаемся на первый доступный файл
      const remainingFiles = Array.from(openFiles.value) as number[]
      remainingFiles.sort((a, b) => a - b)
      activeFileIndex.value = remainingFiles[0]
    } else {
      // Если все файлы закрыты, сбрасываем активный индекс
      activeFileIndex.value = -1
      if (isMobile.value) {
        mobilePanel.value = 'sidebar'
      }
    }
  }
}

// Обработка обычного клика на таб
let clickTimeout: ReturnType<typeof setTimeout> | null = null
function handleTabClick(fileIndex: number, event: MouseEvent) {
  // Предотвращаем закрытие при клике на кнопку закрытия
  if ((event.target as HTMLElement).closest('.code-view__tab-close')) {
    return
  }
  
  // Если был двойной клик, не переключаемся
  if (clickTimeout) {
    clearTimeout(clickTimeout)
    clickTimeout = null
    return
  }
  
  // Небольшая задержка для различения одинарного и двойного клика
  clickTimeout = setTimeout(() => {
    activeFileIndex.value = fileIndex
    clickTimeout = null
  }, 200)
}

// Обработка клика колесом мыши (auxiliary click)
function handleAuxClick(fileIndex: number, event: MouseEvent) {
  // Кнопка 1 = средняя кнопка мыши (колесо)
  if (event.button === 1) {
    event.preventDefault()
    closeFile(fileIndex)
  }
}

// Функция для выбора файла по имени
const selectFileByName = (fileName: string) => {
  const file = allFiles.value.find(f => f.name === fileName)
  if (file) {
    // Открываем файл, если он еще не открыт
    openFiles.value.add(file.index)
    activeFileIndex.value = file.index
    if (isMobile.value) {
      mobilePanel.value = 'content'
    }
  }
}

// Функция для закрытия файла по имени
const closeFileByName = (fileName: string) => {
  const file = allFiles.value.find(f => f.name === fileName)
  if (file) {
    closeFile(file.index)
  }
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const showSidebarPanel = () => {
  if (!isMobile.value) return
  mobilePanel.value = 'sidebar'
}

const showContentPanel = () => {
  if (!isMobile.value || !hasTabs.value) return
  mobilePanel.value = 'content'
}

const clampWidth = (value: number, maxWidth: number) => {
  return Math.max(minSidebarWidth, Math.min(value, maxWidth))
}

const startResize = (event: PointerEvent) => {
  if (!rootRef.value) return
  event.preventDefault()
  const target = event.currentTarget as HTMLElement | null
  if (target?.setPointerCapture) {
    target.setPointerCapture(event.pointerId)
  }
  const startX = event.clientX
  const startWidth = sidebarWidth.value
  const containerWidth = rootRef.value.getBoundingClientRect().width
  const maxWidth = Math.max(minSidebarWidth, containerWidth - minContentWidth)

  isDragging.value = true
  const handleMove = (moveEvent: PointerEvent) => {
    const delta = moveEvent.clientX - startX
    sidebarWidth.value = clampWidth(startWidth + delta, maxWidth)
  }

  const handleUp = () => {
    isDragging.value = false
    window.removeEventListener('pointermove', handleMove)
    window.removeEventListener('pointerup', handleUp)
    if (target?.releasePointerCapture) {
      target.releasePointerCapture(event.pointerId)
    }
  }

  window.addEventListener('pointermove', handleMove)
  window.addEventListener('pointerup', handleUp)
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (isExpanded.value) {
    isExpanded.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
  mediaQuery = window.matchMedia('(max-width: 900px)')
  handleMediaChange = (event: MediaQueryListEvent) => {
    const matches = event.matches
    isMobile.value = matches
    if (!matches) {
      mobilePanel.value = 'content'
    } else if (activeFileIndex.value === -1) {
      mobilePanel.value = 'sidebar'
    }
  }
  isMobile.value = mediaQuery.matches
  if (!isMobile.value) {
    mobilePanel.value = 'content'
  }
  mediaQuery.addEventListener('change', handleMediaChange)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
  if (mediaQuery && handleMediaChange) {
    mediaQuery.removeEventListener('change', handleMediaChange)
  }
})

provide('activeFileIndex', activeFileIndex)
provide('activeFileName', activeFileName)
provide('selectFileByName', selectFileByName)
provide('closeFileByName', closeFileByName)
</script>

<style scoped>
.code-view {
  display: flex;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  border-left: none;
  border-right: none;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
  margin: 1.5rem 0;
  box-shadow: none;
  --code-view-max-height: 600px;
  --code-view-sidebar-width: 240px;
  --code-view-tabs-height: 41px;
  position: relative;
  z-index: 0;
}

.code-view--expanded {
  --code-view-max-height: calc(100vh - 160px);
  --code-view-tabs-height: 41px;
  position: fixed;
  inset: 0;
  padding: 80px;
  margin: 0;
  z-index: 120;
  width: auto;
  border: none;
  backdrop-filter: blur(0);
}

@container (min-width: 0px) {
  .code-view {
    width: calc(100cqw + (2 * var(--feod-doc-content-padding-x, 0px)));
    margin-left: calc(50% - 50cqw - var(--feod-doc-content-padding-x, 0px));
    margin-right: calc(50% - 50cqw - var(--feod-doc-content-padding-x, 0px));
  }
}

.code-view--expanded {
  width: auto;
  margin-left: 0;
  margin-right: 0;
}

.code-view__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.45);
  z-index: 0;
}

.code-view__surface {
  position: relative;
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: var(--code-view-max-height);
  align-items: stretch;
  background: var(--feod-surface, var(--vp-c-bg));
  z-index: 1;
  border-radius: 0;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.code-view--expanded .code-view__surface {
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
}

.code-view__sidebar {
  width: var(--code-view-sidebar-width);
  min-width: var(--code-view-sidebar-width);
  max-height: var(--code-view-max-height);
  border-right: 1px solid var(--vp-c-divider);
  background: transparent;
  overflow: auto;
  transition: max-height 0.35s ease;
  padding: 12px 0 12px 12px;
}

.code-view__divider {
  width: 6px;
  cursor: col-resize;
  background: transparent;
  position: relative;
  flex-shrink: 0;
  touch-action: none;
}

.code-view__divider::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--vp-c-divider);
  opacity: 0.6;
}

.code-view--dragging {
  user-select: none;
}

.code-view--dragging .code-view__divider::before {
  opacity: 1;
}

.code-view__content {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: var(--code-view-max-height);
  max-height: var(--code-view-max-height);
}

.code-view__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.code-view__content-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px 0 12px;
}

.code-view__panel-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: color 0.2s ease, background 0.2s ease;
}

.code-view__panel-toggle :deep(svg) {
  width: 16px;
  height: 16px;
}

.code-view__panel-toggle:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-alt);
}

.code-view__tabs {
  display: flex;
  flex: 0 0 auto;
  background: transparent;
  border-bottom: 1px solid var(--vp-c-divider);
  align-items: center;
  gap: 8px;
  padding-right: 8px;
}

.code-view__tabs-scroll {
  display: flex;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: thin;
  flex: 1 1 auto;
  min-width: 0;
}

.code-view__tabs-scroll::-webkit-scrollbar {
  height: 6px;
}

.code-view__tabs-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.code-view__tabs-scroll::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 999px;
}

.code-view__tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  padding-right: 1.75rem;
  background: transparent;
  border: none;
  border-right: 1px solid var(--vp-c-divider);
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  transition: background-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;
  position: relative;
}

.code-view__tab:hover {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}

.code-view__tab--active {
  background: transparent;
  color: var(--vp-c-text-1);
  border-bottom: 2px solid var(--vp-c-brand-1);
}

.code-view__tab-icon {
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.code-view__tab-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.code-view__tab-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.code-view__tab-close {
  position: absolute;
  right: 0.375rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  padding: 0;
  margin: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2);
  opacity: 0.6;
  transition: opacity 0.2s ease, color 0.2s ease, background-color 0.2s ease;
  border-radius: 3px;
  z-index: 1;
  outline: none;
}

.code-view__tab-close:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.code-view__tab:hover .code-view__tab-close {
  opacity: 0.9;
}

.code-view__tab-close:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-alt);
  opacity: 1;
}

.code-view__tab-close:active {
  background: var(--vp-c-divider);
  opacity: 1;
}

.code-view__tab-close svg {
  width: 0.75rem;
  height: 0.75rem;
  display: block;
}

.code-view__expand {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.2s ease, background 0.2s ease, transform 0.2s ease;
  position: relative;
  z-index: 2;
}

.code-view__expand--standalone {
  align-self: flex-end;
  margin: 8px 8px 0 auto;
}

.code-view__expand:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-alt);
}

.code-view__expand svg {
  width: 16px;
  height: 16px;
}

.code-view__editor {
  flex: 1 1 0;
  position: relative;
  min-height: calc(var(--code-view-max-height) - var(--code-view-tabs-height));
  overflow: hidden;
  background: var(--vp-code-block-bg);
  margin: 0;
  padding: 0;
}

.code-view--no-tabs .code-view__editor {
  min-height: calc(var(--code-view-max-height) - 36px);
}

.code-view__editor :deep(.code-view-file) {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Убираем отступы у всех элементов внутри редактора */
.code-view__editor > * {
  margin: 0;
  padding: 0;
}

.code-view--mobile {
  --code-view-max-height: min(600px, calc(100dvh - 160px));
}

.code-view--mobile.code-view--expanded {
  --code-view-max-height: 100dvh;
}

.code-view--mobile .code-view__surface {
  flex-direction: column;
  min-height: 0;
}

.code-view--mobile .code-view__divider {
  display: none;
}

.code-view--mobile .code-view__sidebar {
  width: 100%;
  min-width: 0;
  border-right: none;
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 12px;
  max-height: none;
}

.code-view--mobile .code-view__tabs {
  padding: 0 12px;
  gap: 6px;
}

.code-view--mobile .code-view__content {
  flex: none;
}

.code-view--mobile .code-view__editor {
  min-height: 0;
}

.code-view--mobile.code-view--mobile-sidebar .code-view__content {
  display: none;
}

.code-view--mobile.code-view--mobile-content .code-view__sidebar {
  display: none;
}

.code-view--mobile.code-view--no-tabs .code-view__content {
  display: none;
}

.code-view--mobile.code-view--no-tabs .code-view__sidebar {
  display: block;
}

.code-view__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 24px;
  color: var(--vp-c-text-3);
  background: var(--vp-code-block-bg);
}

.code-view__empty-text {
  margin: 0;
  font-size: 0.875rem;
  text-align: center;
}

.code-view--mobile .code-view__empty {
  position: static;
  min-height: 160px;
}

@media (max-width: 900px) {
  .code-view--expanded {
    padding: 0;
  }

  .code-view--expanded .code-view__surface {
    border-radius: 0;
    border: none;
  }
}
</style>
