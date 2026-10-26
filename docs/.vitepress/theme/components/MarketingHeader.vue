<script setup lang="ts">
import { computed, provide } from 'vue'
import { useData, useRoute } from 'vitepress'
import { useNav, navInjectionKey } from 'vitepress/dist/client/theme-default/composables/nav'
import VPNavBarHamburger from 'vitepress/dist/client/theme-default/components/VPNavBarHamburger.vue'
import VPNavScreen from 'vitepress/dist/client/theme-default/components/VPNavScreen.vue'
import VPNavAppearance from 'vitepress/dist/client/theme-default/components/VPNavAppearance.vue'
import VPNavSocialLinks from 'vitepress/dist/client/theme-default/components/VPNavSocialLinks.vue'
import FrameworkSwitcher from './FrameworkSwitcher.vue'

const props = defineProps<{
  variant?: 'docs' | 'marketing'
}>()

const { theme, site } = useData()
const { isScreenOpen, toggleScreen, closeScreen } = useNav()

provide(navInjectionKey, { closeScreen })

const logo = computed(() => {
  const value = theme.value.logo
  if (typeof value === 'string') {
    return { light: value, dark: value }
  }
  if (value && typeof value === 'object') {
    return {
      light: (value as { light?: string }).light || '',
      dark: (value as { dark?: string }).dark || (value as { light?: string }).light || '',
    }
  }
  return { light: '', dark: '' }
})

const logoLightSrc = computed(() => logo.value.light || '')
const logoDarkSrc = computed(() => logo.value.dark || logo.value.light || '')
const logoAlt = computed(() => site.value.title || 'FEOD')

const navItems = computed(() => {
  const items = theme.value.nav || []
  return items.map((item: any) => {
    if (item.link) return item
    if (item.items && item.items.length > 0) {
      return { text: item.text, link: item.items[0].link }
    }
    return item
  })
})

const route = useRoute()

const isActive = (link: string) => {
  return route.path.startsWith(link)
}

</script>

<template>
  <header
    class="feod-header"
    :class="{ 'feod-header--docs': props.variant === 'docs' }"
  >
    <div class="feod-header__inner">
      <a href="/" class="feod-header__brand">
        <img v-if="logoLightSrc" :src="logoLightSrc" :alt="logoAlt" class="feod-header__logo feod-header__logo--light" />
        <img v-if="logoDarkSrc" :src="logoDarkSrc" :alt="logoAlt" class="feod-header__logo feod-header__logo--dark" />
        <span v-else class="feod-header__wordmark">FEOD</span>
      </a>
      <nav class="feod-header__nav">
        <a
          v-for="item in navItems"
          :key="item.text"
          :href="item.link"
          class="feod-header__link"
          :class="{ 'feod-header__link--active': isActive(item.link) }"
        >
          {{ item.text }}
        </a>
      </nav>
      <div class="feod-header__actions">
        <div class="feod-header__framework">
          <FrameworkSwitcher />
        </div>
        <div class="feod-header__tools">
          <VPNavSocialLinks />
          <VPNavAppearance />
        </div>
        <VPNavBarHamburger :active="isScreenOpen" @click="toggleScreen" />
      </div>
    </div>
  </header>
  <VPNavScreen :open="isScreenOpen" />
</template>

<style scoped>
.feod-header {
  background: var(--feod-bg);
  border-bottom: 1px solid var(--feod-border);
}

.feod-header--docs {
  position: fixed;
  top: var(--feod-banner-height, 0px);
  left: 0;
  right: 0;
  z-index: 50;
  height: var(--feod-header-height, 72px);
}

.feod-header__inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.feod-header--docs .feod-header__inner {
  height: 100%;
}

.feod-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.feod-header__logo {
  height: 18px;
}

.feod-header__logo--dark {
  display: none;
}

:root.dark .feod-header__logo--light,
[data-theme='dark'] .feod-header__logo--light {
  display: none;
}

:root.dark .feod-header__logo--dark,
[data-theme='dark'] .feod-header__logo--dark {
  display: block;
}

.feod-header__wordmark {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--feod-text-weak);
}

.feod-header__nav {
  display: none;
  gap: 20px;
  align-items: center;
}

@media (min-width: 840px) {
  .feod-header__nav {
    display: flex;
  }
}

.feod-header__link {
  color: var(--feod-text-weak);
  text-decoration: none;
  font-size: 14px;
}

.feod-header__link:hover {
  color: var(--feod-text);
}

.feod-header__link--active {
  color: var(--feod-text);
}

.feod-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feod-header__framework {
  display: flex;
  align-items: center;
}

.feod-header__tools {
  display: none;
  align-items: center;
  gap: 12px;
}

@media (min-width: 960px) {
  .feod-header__tools {
    display: flex;
  }
}

:deep(.VPNavBarHamburger) {
  height: 44px;
  color: var(--feod-text);
}

:deep(.VPNavAppearance),
:deep(.VPNavSocialLinks) {
  display: flex !important;
  align-items: center;
}

:deep(.VPNavSocialLinks) {
  display: flex;
  align-items: center;
}

:deep(.VPSocialLinks) {
  gap: 8px;
}

:deep(.VPSocialLink) {
  color: var(--feod-text-weak);
}

:deep(.VPSocialLink:hover) {
  color: var(--feod-text);
}
</style>
