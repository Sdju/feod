// https://vitepress.dev/guide/custom-theme
import { watch } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import LayoutWrapper from './LayoutWrapper.vue'
import FeodLanding from './landing/FeodLanding.vue'
import { FileTree, FileTreeNode } from '../ui/file-tree'
import { CodeView, CodeViewFile } from '../ui/code-view'
import { CodeAnnotation, AnnotatedCode } from '../ui/code-annotation'
import { createTooltipManager, TOOLTIP_SYMBOL } from '../ui/tooltip'

// Создаем tooltip manager на уровне модуля
const globalTooltipManager = createTooltipManager()

export default {
  extends: DefaultTheme,
  Layout: LayoutWrapper,
  enhanceApp(context) {
    const { app, router, siteData } = context

    const variant = siteData.value.themeConfig?.variant || 'voidzero'
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-variant', variant)

      watch(
        () => router.route.data.frontmatter?.theme,
        (theme) => {
          if (theme) {
            document.documentElement.setAttribute('data-theme', theme)
          } else {
            document.documentElement.removeAttribute('data-theme')
          }
        },
        { immediate: true }
      )
    }

    app.provide('selectFileByName', () => {})
    // Предоставляем tooltip manager на уровне приложения
    app.provide(TOOLTIP_SYMBOL, globalTooltipManager)
    
    // Регистрируем компоненты глобально
    app.component('FileTree', FileTree)
    app.component('FileTreeNode', FileTreeNode)
    app.component('CodeView', CodeView)
    app.component('CodeViewFile', CodeViewFile)
    app.component('CodeAnnotation', CodeAnnotation)
    app.component('AnnotatedCode', AnnotatedCode)
    app.component('FeodLanding', FeodLanding)
  },
} satisfies Theme
