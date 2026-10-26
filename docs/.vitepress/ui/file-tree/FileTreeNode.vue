<template>
  <li class="file-tree-node" :style="{ '--file-tree-depth': depth }">
    <div 
      class="file-tree-node__header"
      :class="{
        'file-tree-node__header--folder': isFolder && hasSlot,
        'file-tree-node__header--expanded': isExpanded,
        'file-tree-node__header--active': isActive
      }"
      :style="headerStyle"
    >
      <span class="file-tree-node__guides" aria-hidden="true"></span>
      <button
        v-if="isFolder && hasSlot"
        class="file-tree-node__toggle"
        @click="toggle"
        :aria-expanded="isExpanded"
        aria-label="Переключить видимость"
      >
        <svg 
          class="file-tree-node__icon file-tree-node__icon--chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
      <span 
        v-else
        class="file-tree-node__spacer"
      ></span>
      
      <span class="file-tree-node__icon file-tree-node__icon--type">
        <component :is="typeIconComponent" aria-hidden="true" />
      </span>
      
      <component
        :is="link ? 'a' : (selectable ? 'button' : 'span')"
        :href="link"
        :class="{
          'file-tree-node__name': true,
          'file-tree-node__name--link': !!link,
          'file-tree-node__name--selectable': isSelectable && !link,
          'file-tree-node__name--variant': variant,
          'file-tree-node__name--forbidden': forbidden,
          'file-tree-node__name--bold': bold,
          'file-tree-node__name--optional': optional
        }"
        @mouseenter="comment ? (event) => showTooltip(event, comment) : undefined"
        @mouseleave="comment ? hideTooltip : undefined"
        @click="handleClick"
      >
        {{ name }}
      </component>
      
      <div 
        v-if="hasIndicators || comment"
        class="file-tree-node__indicators"
      >
        <span
          v-if="comment"
          class="file-tree-node__badge file-tree-node__badge--comment"
          @mouseenter="(event) => showTooltip(event, comment)"
          @mouseleave="hideTooltip"
        >
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 4.81c0 .54.356.888.924.888.609 0 .93-.405.93-.888 0-.52-.315-.88-.93-.88-.584 0-.925.36-.925.88z"/>
          </svg>
        </span>
        <span
          v-if="multiple"
          class="file-tree-node__badge file-tree-node__badge--multiple"
          @mouseenter="(event) => showTooltip(event, 'Наличие 1 или более сущностей')"
          @mouseleave="hideTooltip"
        >
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
        </span>
        <span
          v-if="fractal"
          class="file-tree-node__badge file-tree-node__badge--fractal"
          @mouseenter="(event) => showTooltip(event, fractalTooltip)"
          @mouseleave="hideTooltip"
        >
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
          </svg>
        </span>
        <span
          v-if="forbidden"
          class="file-tree-node__badge file-tree-node__badge--forbidden"
          @mouseenter="(event) => showTooltip(event, 'Запрещено создавать')"
          @mouseleave="hideTooltip"
        >
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
          </svg>
        </span>
      </div>
      
    </div>
    
    <ul
      v-if="isFolder && isExpanded && hasSlot"
      class="file-tree-node__children"
    >
      <slot />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, inject, provide } from 'vue'
import IconFolder from '~icons/lucide/folder'
import IconFile from '~icons/lucide/file'
import IconVue from '~icons/devicon/vuejs'
import IconTypeScript from '~icons/devicon/typescript'
import IconJavaScript from '~icons/devicon/javascript'
import IconHtml from '~icons/devicon/html5'
import IconCss from '~icons/devicon/css3'
import IconJson from '~icons/devicon/json'
import IconMarkdown from '~icons/devicon/markdown'
import FileTreeNode from './FileTreeNode.vue'
import { injectTooltip } from '../tooltip'
import { fileTreeDepthKey } from './keys'

interface Props {
  /** Имя файла или папки */
  name: string
  /** Тип: файл, папка или оба */
  type?: 'file' | 'folder' | 'both'
  /** Ссылка на страницу/файл */
  link?: string
  /** Комментарий в скобках */
  comment?: string
  /** Вариативная часть */
  variant?: boolean
  /** Фрактальная сущность */
  fractal?: boolean
  /** Комментарий для фрактальной сущности */
  fractalComment?: string
  /** Наличие 1 или более сущностей */
  multiple?: boolean
  /** Опциональное наличие */
  optional?: boolean
  /** Запрещено создавать (зачеркнутый текст) */
  forbidden?: boolean
  /** Жирный текст */
  bold?: boolean
  /** Уровень вложенности (для внутреннего использования) */
  level?: number
  /** Можно ли выбрать этот файл (для CodeView) */
  selectable?: boolean
  /** ID файла для выбора (если отличается от name) */
  fileId?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'file',
  level: 0,
  selectable: false
})

const slots = useSlots()
const selectFileByName = inject<(fileName: string) => void>('selectFileByName')
const activeFileName = inject<ReturnType<typeof computed> | null>('activeFileName', null)
const depth = inject(fileTreeDepthKey, 0)
provide(fileTreeDepthKey, depth + 1)

let tooltipManager: ReturnType<typeof injectTooltip> | null = null

try {
  tooltipManager = injectTooltip()
} catch {
  // Tooltip manager может быть не предоставлен
  tooltipManager = null
}

const isExpanded = ref(props.level === 0) // По умолчанию первый уровень развернут

const hasSlot = computed(() => {
  return !!slots.default
})

const isFolder = computed(() => {
  return props.type === 'folder' || props.type === 'both' || hasSlot.value
})

const fileExtension = computed(() => {
  const name = props.name.toLowerCase()
  if (name.endsWith('.d.ts')) return 'd.ts'
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
})

const typeIconComponent = computed(() => {
  if (isFolder.value) return IconFolder

  switch (fileExtension.value) {
    case 'vue':
      return IconVue
    case 'ts':
    case 'tsx':
    case 'd.ts':
      return IconTypeScript
    case 'js':
    case 'jsx':
      return IconJavaScript
    case 'html':
      return IconHtml
    case 'css':
    case 'scss':
    case 'sass':
      return IconCss
    case 'json':
      return IconJson
    case 'md':
    case 'mdx':
      return IconMarkdown
    default:
      return IconFile
  }
})

const link = computed(() => {
  return props.link
})

const hasIndicators = computed(() => {
  return props.multiple || props.fractal || props.optional || props.forbidden
})

const fractalTooltip = computed(() => {
  if (!props.fractalComment) return 'Фрактальная сущность'
  return `Фрактальная сущность: ${props.fractalComment}`
})

function showTooltip(event: MouseEvent, content: string) {
  if (!tooltipManager || !content) return

  const target = event.currentTarget as HTMLElement
  if (!target) return

  const rect = target.getBoundingClientRect()
  tooltipManager.showTooltip({
    content,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    position: 'top',
    targetElement: target
  })
}

function hideTooltip() {
  if (!tooltipManager) return
  tooltipManager.hideTooltip()
}

const isSelectable = computed(() => {
  return props.selectable && !props.link && (props.type === 'file' || props.type === 'both')
})

const isActive = computed(() => {
  const current = activeFileName?.value
  if (!current) return false
  const id = props.fileId || props.name
  return id === current
})

const headerStyle = computed(() => ({
  paddingLeft: `calc(${depth} * var(--file-tree-indent-step))`
}))

function toggle() {
  if (isFolder.value) {
    isExpanded.value = !isExpanded.value
  }
}

function handleClick(event: Event) {
  if (isSelectable.value && selectFileByName && !props.link) {
    event.preventDefault()
    const fileName = props.fileId || props.name
    selectFileByName(fileName)
  }
}
</script>

<style scoped>
.file-tree-node {
  list-style: none;
  margin: 0;
  padding: 0;
  --file-tree-indent-step: 1.625rem;
}

.file-tree-node__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  min-height: 1.75rem;
  line-height: 1.5;
  position: relative;
  width: 100%;
  overflow: visible;
}

.file-tree-node__guides {
  position: absolute;
  left: -4px;
  top: 0;
  bottom: 0;
  width: calc(var(--file-tree-depth, 0) * var(--file-tree-indent-step));
  background-image: repeating-linear-gradient(
    to right,
    var(--vp-c-divider) 0 1px,
    transparent 1px var(--file-tree-indent-step)
  );
  background-position: calc(var(--file-tree-indent-step) / 2) 0;
  pointer-events: none;
  opacity: 0.9;
  z-index: 3;
}

.file-tree-node__header--active {
}

.file-tree-node__header--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: var(--feod-panel-muted, rgba(15, 23, 42, 0.08));
  border-radius: 6px;
  z-index: 0;
}

.file-tree-node__header--active > :not(.file-tree-node__guides) {
  position: relative;
  z-index: 2;
}
.file-tree-node__header--folder {
  cursor: pointer;
}

.file-tree-node__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  margin: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2);
  transition: transform 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.file-tree-node__toggle:hover {
  color: var(--vp-c-text-1);
}

.file-tree-node__header--expanded .file-tree-node__icon--chevron {
  transform: rotate(90deg);
}

.file-tree-node__spacer {
  width: 1.25rem;
  flex-shrink: 0;
}

.file-tree-node__icon {
  flex-shrink: 0;
  user-select: none;
}

.file-tree-node__icon--chevron {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform 0.2s ease;
}

.file-tree-node__icon--type {
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.file-tree-node__icon--type :deep(svg) {
  width: 1rem;
  height: 1rem;
}

.file-tree-node__name {
  color: var(--vp-c-text-1);
  font-size: 1rem;
  word-break: break-word;
  white-space: nowrap;
  overflow: visible;
}

.file-tree-node__name:not(.file-tree-node__name--selectable):not(.file-tree-node__name--link) {
  color: var(--vp-c-text-2);
}

.file-tree-node__name--link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: color 0.2s ease;
}

.file-tree-node__name--link:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

.file-tree-node__name--variant {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  color: var(--vp-c-brand-1);
  font-style: italic;
}

.file-tree-node__name--bold {
  font-weight: 600;
}

.file-tree-node__name--forbidden {
  text-decoration: line-through;
  opacity: 0.6;
  color: var(--vp-c-danger-1);
}

.file-tree-node__name--optional {
  opacity: 0.6;
}

.file-tree-node__name--selectable {
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  text-align: left;
  transition: color 0.2s ease;
  flex: 0 0 auto;
}

.file-tree-node__name--selectable:hover {
  color: var(--vp-c-brand-1);
}

.file-tree-node__indicators {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.25rem;
}

.file-tree-node__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--vp-c-text-2);
  transition: color 0.2s ease;
}

.file-tree-node__badge svg {
  width: 100%;
  height: 100%;
}

.file-tree-node__badge--multiple {
  color: var(--vp-c-brand-1);
}

.file-tree-node__badge--fractal {
  color: var(--vp-c-warning-1);
}

.file-tree-node__badge--forbidden {
  color: var(--vp-c-danger-1);
}

.file-tree-node__badge--comment {
  color: var(--vp-c-brand-1);
  cursor: help;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.file-tree-node__badge--comment:hover {
  opacity: 1;
}


.file-tree-node__children {
  margin: 0;
  padding-left: 0;
  list-style: none;
  border-left: none;
  margin-left: 0;
}
</style>
