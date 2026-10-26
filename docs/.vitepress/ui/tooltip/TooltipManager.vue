<template>
  <Teleport to="body">
    <Transition name="tooltip">
      <div
        v-if="tooltip && tooltip.content"
        ref="tooltipRef"
        class="tooltip-manager"
        :class="`tooltip-manager--${tooltip.position || 'top'}`"
        :style="tooltipStyle"
      >
        <div class="tooltip-manager__content" v-html="tooltip.content"></div>
        <div class="tooltip-manager__arrow"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useTooltip, injectTooltip } from './useTooltip'

// Используем injectTooltip, так как tooltip предоставляется на уровне Layout
const tooltipManager = injectTooltip()
const { tooltip } = tooltipManager
const tooltipRef = ref<HTMLElement | null>(null)

const tooltipStyle = computed(() => {
  if (!tooltip.value) return { display: 'none' }
  
  const { x, y, position } = tooltip.value
  
  // Проверяем валидность координат
  if (isNaN(x) || isNaN(y)) {
    return { display: 'none' }
  }
  
  // Базовые стили для позиционирования
  const baseStyle: Record<string, string> = {
    position: 'fixed',
    zIndex: '10000',
    pointerEvents: 'auto'
  }
  
  // Позиционирование в зависимости от позиции
  // x и y уже скорректированы в updatePosition
  switch (position || 'top') {
    case 'top':
      baseStyle.left = `${x}px`
      baseStyle.top = `${y}px`
      baseStyle.transform = 'translateX(-50%) translateY(calc(-100% - 0.5rem))'
      break
    case 'bottom':
      baseStyle.left = `${x}px`
      baseStyle.top = `${y}px`
      baseStyle.transform = 'translateX(-50%) translateY(0.5rem)'
      break
    case 'left':
      baseStyle.left = `${x}px`
      baseStyle.top = `${y}px`
      baseStyle.transform = 'translateX(calc(-100% - 0.5rem)) translateY(-50%)'
      break
    case 'right':
      baseStyle.left = `${x}px`
      baseStyle.top = `${y}px`
      baseStyle.transform = 'translateX(0.5rem) translateY(-50%)'
      break
  }
  
  return baseStyle
})

// Обновляем позицию при скролле или изменении размера окна
function updatePosition() {
  if (typeof window === 'undefined') return
  if (!tooltip.value || !tooltipRef.value) return
  
  const { targetElement, position } = tooltip.value
  if (!targetElement) return
  
  const rect = targetElement.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  
  // Если tooltip еще не отрендерен, ждем
  if (tooltipRect.width === 0 || tooltipRect.height === 0) {
    return
  }
  
  let x = rect.left + rect.width / 2
  let y = rect.top + rect.height / 2
  
  // Корректируем позицию, чтобы tooltip не выходил за границы экрана
  const padding = 8
  
  if (position === 'top') {
    // Для top: x по центру элемента, y выше элемента
    const maxX = window.innerWidth - tooltipRect.width / 2 - padding
    const minX = tooltipRect.width / 2 + padding
    x = Math.max(minX, Math.min(maxX, x))
    y = rect.top // y будет использован для top в CSS
  } else if (position === 'bottom') {
    // Для bottom: x по центру элемента, y ниже элемента
    const maxX = window.innerWidth - tooltipRect.width / 2 - padding
    const minX = tooltipRect.width / 2 + padding
    x = Math.max(minX, Math.min(maxX, x))
    y = rect.bottom // y будет использован для top в CSS
  } else if (position === 'left') {
    // Для left: x слева от элемента, y по центру элемента
    const maxY = window.innerHeight - tooltipRect.height / 2 - padding
    const minY = tooltipRect.height / 2 + padding
    y = Math.max(minY, Math.min(maxY, y))
    x = rect.left // x будет использован для left в CSS
  } else { // right
    // Для right: x справа от элемента, y по центру элемента
    const maxY = window.innerHeight - tooltipRect.height / 2 - padding
    const minY = tooltipRect.height / 2 + padding
    y = Math.max(minY, Math.min(maxY, y))
    x = rect.right // x будет использован для left в CSS
  }
  
  tooltip.value.x = x
  tooltip.value.y = y
}

let updateTimer: ReturnType<typeof requestAnimationFrame> | null = null

function scheduleUpdate() {
  if (updateTimer) return
  updateTimer = requestAnimationFrame(() => {
    updatePosition()
    updateTimer = null
  })
}

// Закрываем tooltip при клике вне его
function handleClickOutside(event: MouseEvent) {
  if (!tooltip.value || !tooltipRef.value) return
  
  const target = event.target as HTMLElement
  if (!target) return
  
  // Не закрываем, если клик внутри tooltip или на маркере
  if (tooltipRef.value.contains(target) || tooltip.value.targetElement?.contains(target)) {
    return
  }
  
  tooltipManager.hideTooltip()
}

watch(() => tooltip.value, async (newTooltip) => {
  if (typeof window === 'undefined') return
  
  if (newTooltip) {
    await nextTick()
    updatePosition()
    
    // Повторяем обновление, если tooltip еще не отрендерился
    if (tooltipRef.value && (tooltipRef.value.getBoundingClientRect().width === 0 || tooltipRef.value.getBoundingClientRect().height === 0)) {
      requestAnimationFrame(updatePosition)
    }
    
    window.addEventListener('scroll', scheduleUpdate, true)
    window.addEventListener('resize', scheduleUpdate)
    document.addEventListener('click', handleClickOutside)
  } else {
    window.removeEventListener('scroll', scheduleUpdate, true)
    window.removeEventListener('resize', scheduleUpdate)
    document.removeEventListener('click', handleClickOutside)
  }
})

onMounted(() => {
  if (tooltip.value) {
    updatePosition()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', scheduleUpdate, true)
    window.removeEventListener('resize', scheduleUpdate)
    document.removeEventListener('click', handleClickOutside)
    if (updateTimer) {
      cancelAnimationFrame(updateTimer)
    }
  }
})
</script>

<style scoped>
.tooltip-manager {
  position: fixed;
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
  pointer-events: none;
  z-index: 10000;
}

.tooltip-manager__content {
  position: relative;
  z-index: 1;
}

.tooltip-manager__content :deep(p) {
  margin: 0 0 0.5rem 0;
}

.tooltip-manager__content :deep(p:last-child) {
  margin-bottom: 0;
}

.tooltip-manager__content :deep(strong) {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.tooltip-manager__arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.tooltip-manager--top .tooltip-manager__arrow {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px 6px 0 6px;
  border-color: var(--vp-c-bg) transparent transparent transparent;
}

.tooltip-manager--bottom .tooltip-manager__arrow {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 6px 6px;
  border-color: transparent transparent var(--vp-c-bg) transparent;
}

.tooltip-manager--left .tooltip-manager__arrow {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 0 6px 6px;
  border-color: transparent transparent transparent var(--vp-c-bg);
}

.tooltip-manager--right .tooltip-manager__arrow {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 6px 6px 0;
  border-color: transparent var(--vp-c-bg) transparent transparent;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-enter-from {
  opacity: 0;
}

.tooltip-leave-to {
  opacity: 0;
}

.tooltip-enter-to,
.tooltip-leave-from {
  opacity: 1;
}

/* Анимации для разных позиций */
.tooltip-manager--top .tooltip-enter-from,
.tooltip-manager--top .tooltip-leave-to {
  transform: translateX(-50%) translateY(calc(-100% - 0.5rem - 4px));
}

.tooltip-manager--top .tooltip-enter-to,
.tooltip-manager--top .tooltip-leave-from {
  transform: translateX(-50%) translateY(calc(-100% - 0.5rem));
}

.tooltip-manager--bottom .tooltip-enter-from,
.tooltip-manager--bottom .tooltip-leave-to {
  transform: translateX(-50%) translateY(calc(0.5rem + 4px));
}

.tooltip-manager--bottom .tooltip-enter-to,
.tooltip-manager--bottom .tooltip-leave-from {
  transform: translateX(-50%) translateY(0.5rem);
}

.tooltip-manager--left .tooltip-enter-from,
.tooltip-manager--left .tooltip-leave-to {
  transform: translateX(calc(-100% - 0.5rem - 4px)) translateY(-50%);
}

.tooltip-manager--left .tooltip-enter-to,
.tooltip-manager--left .tooltip-leave-from {
  transform: translateX(calc(-100% - 0.5rem)) translateY(-50%);
}

.tooltip-manager--right .tooltip-enter-from,
.tooltip-manager--right .tooltip-leave-to {
  transform: translateX(calc(0.5rem + 4px)) translateY(-50%);
}

.tooltip-manager--right .tooltip-enter-to,
.tooltip-manager--right .tooltip-leave-from {
  transform: translateX(0.5rem) translateY(-50%);
}
</style>

