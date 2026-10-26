<template>
  <div
    v-if="useDefaultLayout"
    ref="layoutRootRef"
    class="docs-layout"
    :data-theme="frontmatter.theme"
    :data-framework="base"
    :data-runtime="runtime || undefined"
  >
    <MarketingHeader variant="docs" />
    <DefaultTheme.Layout>
      <template #layout-top>
        <div v-if="!bannerDismissed" class="feod-banner">
          <div ref="bannerInnerRef" class="feod-banner__inner">
            <span class="feod-banner__badge">Beta</span>
            <span class="feod-banner__text">Документация для beta‑теста, возможны ошибки и неточности.</span>
            <span
              class="feod-banner__hint"
              aria-label="Документация пока меняется и нуждается в помощи — это не финальный справочник."
              @mouseenter="(event) => showBannerTooltip(event)"
              @mouseleave="hideBannerTooltip"
            >
              <IconInfo />
            </span>
            <button
              type="button"
              class="feod-banner__close"
              aria-label="Закрыть предупреждение"
              title="Закрыть предупреждение"
              @click="dismissBanner"
            ><IconX /></button>
          </div>
        </div>
        <slot name="layout-top" />
      </template>
      <template v-for="name in slotNames" #[name]="slotData">
        <slot :name="name" v-bind="slotData || {}" />
      </template>
    </DefaultTheme.Layout>
  </div>
  <div
    v-else
    ref="layoutRootRef"
    class="marketing-layout"
    :data-theme="frontmatter.theme"
    :data-framework="base"
    :data-runtime="runtime || undefined"
  >
    <div v-if="!bannerDismissed" class="feod-banner">
      <div ref="bannerInnerRef" class="feod-banner__inner">
        <span class="feod-banner__badge">Beta</span>
        <span class="feod-banner__text">Документация доступна только для закрытого beta‑теста.</span>
        <span
          class="feod-banner__hint"
          aria-label="Документация пока меняется и нуждается в помощи — это не финальный справочник."
          @mouseenter="(event) => showBannerTooltip(event)"
          @mouseleave="hideBannerTooltip"
        >
          <IconInfo />
        </span>
        <button
          type="button"
          class="feod-banner__close"
          aria-label="Закрыть предупреждение"
          title="Закрыть предупреждение"
          @click="dismissBanner"
        ><IconX /></button>
      </div>
    </div>
    <MarketingHeader />
    <Content />
  </div>
  <TooltipManager />
</template>

<script setup lang="ts">
import { provide, computed, useSlots, ref, watch } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import MarketingHeader from './components/MarketingHeader.vue'
import { TooltipManager } from '../ui/tooltip'
import { createTooltipManager, TOOLTIP_SYMBOL } from '../ui/tooltip'
import { useFramework } from './composables/framework'
import IconInfo from '~icons/lucide/info'
import IconX from '~icons/lucide/x'
import { useResizeObserver } from '@vueuse/core'

const { frontmatter } = useData()
const slots = useSlots()
const slotNames = computed(() => Object.keys(slots).filter((name) => name !== 'layout-top'))
const { base, runtime } = useFramework()
const layoutRootRef = ref<HTMLElement | null>(null)
const bannerInnerRef = ref<HTMLElement | null>(null)
const bannerDismissed = ref(false)

const useDefaultLayout = computed(() => {
  const layout = frontmatter.value.layout
  if (!layout) return true
  if (layout === 'doc' || layout === 'page') return true
  return false
})

// Создаем и предоставляем tooltip manager
const tooltipManager = createTooltipManager()
provide(TOOLTIP_SYMBOL, tooltipManager)

const bannerTooltip = 'Документация пока меняется и нуждается в помощи — это не финальный справочник.'

const showBannerTooltip = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  if (!target) return
  const rect = target.getBoundingClientRect()
  tooltipManager.showTooltip({
    content: bannerTooltip,
    x: rect.left + rect.width / 2,
    y: rect.bottom,
    position: 'bottom',
    targetElement: target
  })
}

const hideBannerTooltip = () => {
  tooltipManager.hideTooltip()
}

const dismissBanner = () => {
  hideBannerTooltip()
  bannerDismissed.value = true
}

const updateBannerHeight = () => {
  if (!layoutRootRef.value) return
  const height = bannerDismissed.value ? 0 : Math.ceil(bannerInnerRef.value?.getBoundingClientRect().height ?? 40)
  layoutRootRef.value.style.setProperty('--feod-banner-height', `${height}px`)
}

useResizeObserver(bannerInnerRef, () => {
  updateBannerHeight()
})

watch([layoutRootRef, bannerInnerRef, bannerDismissed], updateBannerHeight, { flush: 'post' })
</script>

<style scoped>
.vp-layout-wrapper {
  width: 100%;
  height: 100%;
}
</style>
