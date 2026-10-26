import { ref, provide, inject } from 'vue'

export interface TooltipData {
  content: string
  x: number
  y: number
  position: 'top' | 'bottom' | 'left' | 'right'
  targetElement?: HTMLElement
}

const tooltipSymbol = Symbol('tooltip')

export function useTooltip() {
  const tooltip = ref<TooltipData | null>(null)
  
  function showTooltip(data: TooltipData) {
    tooltip.value = data
  }
  
  function hideTooltip() {
    tooltip.value = null
  }
  
  return {
    tooltip,
    showTooltip,
    hideTooltip
  }
}

export function provideTooltip() {
  const tooltipManager = useTooltip()
  provide(tooltipSymbol, tooltipManager)
  return tooltipManager
}

// Для использования с app.provide
export function createTooltipManager() {
  return useTooltip()
}

export const TOOLTIP_SYMBOL = tooltipSymbol

export function injectTooltip() {
  const tooltipManager = inject<ReturnType<typeof useTooltip>>(tooltipSymbol)
  if (!tooltipManager) {
    throw new Error('Tooltip manager not provided')
  }
  return tooltipManager
}

