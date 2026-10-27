import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import Icons from 'unplugin-icons/vite'
import { feodMarkdownMacros } from './plugins/markdown-macros'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '..')

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Open FEOD",
  description: "Универсальная Frontend-архитектура",
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/feod-o-logo.svg' }]
  ],
  vite: {
    plugins: [
      feodMarkdownMacros(srcDir),
      Icons({
        compiler: 'vue3',
        collectionsNodeResolvePath: srcDir,
      })
    ]
  },
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    variant: 'viteplus',
    logo: {
      light: '/feod-full-logo-dark.svg',
      dark: '/feod-full-logo.svg',
    },
    outline: { label: 'На этой странице' },
    lastUpdatedText: 'Обновлено',
    docFooter: {
      prev: 'Предыдущая страница',
      next: 'Следующая страница'
    },
    returnToTopLabel: 'Наверх',
    sidebarMenuLabel: 'Меню',
    darkModeSwitchLabel: 'Тема',
    lightModeSwitchTitle: 'Светлая тема',
    darkModeSwitchTitle: 'Темная тема',
    skipToContentLabel: 'Перейти к содержимому',
    notFound: {
      title: 'Страница не найдена',
      quote: 'Возможно, адрес изменился или страница удалена.',
      linkLabel: 'На главную',
      linkText: 'Вернуться на главную'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Основы', link: '/base/' },
      { text: 'Структура', link: '/structure/' },
      { text: 'Примеры', link: '/examples/' },
      { text: 'Линтеры', link: '/linting/' },
      { text: 'Инструменты', link: '/tools/' },
      { text: 'Статьи', link: '/articles/' },
      { text: 'Прочее', link: '/other/' }
    ],

    sidebar: [
      {
        text: 'Основы',
        link: '/base/',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Введение', link: '/base/introduction' },
          { text: 'Быстрое введение', link: '/base/briefly' },
          { text: 'На примере проекта', link: '/base/project-example' },
          { text: 'Расширения', link: '/base/extensions' },
          { text: 'Сравнения', link: '/base/comparison' },
          { text: 'Модификации', link: '/base/modifications' }
        ]
      },
      {
        text: 'Структура',
        link: '/structure/',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'App', link: '/structure/app' },
          { text: 'Pages', link: '/structure/pages' },
          { text: 'Modules', link: '/structure/modules' },
          { text: 'Common', link: '/structure/common' },
          { text: 'Global', link: '/structure/global' }
        ]
      },
      {
        text: 'Примеры',
        link: '/examples/',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Переход на FEOD', link: '/examples/migration' },
          { text: 'Базовый модуль', link: '/examples/basic-module' },
          { text: 'Vue и React SPA', link: '/examples/spa' },
          { text: 'Все фреймворки', link: '/examples/frameworks' }
        ]
      },
      {
        text: 'Линтеры',
        link: '/linting/',
        collapsed: true,
        items: [
          { text: 'Настройка ESLint', link: '/linting/eslint' },
          { text: 'Настройка Oxlint', link: '/linting/oxlint' },
          { text: 'Конфигурация FEOD', link: '/linting/configuration' },
          { text: 'Постепенная миграция', link: '/linting/migration' },
          {
            text: 'Правила',
            link: '/linting/rules/',
            collapsed: true,
            items: [
              { text: 'layer-imports', link: '/linting/rules/layer-imports' },
              { text: 'no-common-index', link: '/linting/rules/no-common-index' },
              { text: 'no-common-deep', link: '/linting/rules/no-common-deep' },
              { text: 'no-zigzag-imports', link: '/linting/rules/no-zigzag-imports' },
              { text: 'no-unknown-files', link: '/linting/rules/no-unknown-files' },
              { text: 'no-submodule-of-submodule', link: '/linting/rules/no-submodule-of-submodule' },
              { text: 'pages-private-modules', link: '/linting/rules/pages-private-modules' },
              { text: 'visibility-levels', link: '/linting/rules/visibility-levels' },
              { text: 'global-files', link: '/linting/rules/global-files' },
              { text: 'module-names', link: '/linting/rules/module-names' },
              { text: 'module-entries', link: '/linting/rules/module-entries' },
              { text: 'no-module-cycles', link: '/linting/rules/no-module-cycles' },
              { text: 'no-file-cycles', link: '/linting/rules/no-file-cycles' },
              { text: 'large-files', link: '/linting/rules/large-files' },
              { text: 'confine', link: '/linting/rules/confine' },
            ],
          },
        ],
      },
      {
        text: 'Инструменты',
        link: '/tools/',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'ESLint и Oxlint', link: '/linting/' },
          { text: 'AI Rule Generator', link: '/tools/ai-rule-generator' },
        ]
      },
      {
        text: 'Статьи',
        link: '/articles/',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Связанные модули: как разорвать цикл', link: '/articles/module-links' },
          { text: 'FEOD для бэкенда и BFF', link: '/articles/backend' },
          { text: 'Одно ядро для нескольких приложений', link: '/articles/shared-core' },
          { text: 'Проверка границ в ежедневной работе', link: '/articles/daily-checks' }
        ]
      },
      {
        text: 'Прочее',
        link: '/other/',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Где хранить...', link: '/other/where' },
          { text: 'Часто задаваемые вопросы', link: '/other/faq' },
          { text: 'Глоссарий', link: '/other/glossary' },
          { text: 'Roadmap', link: '/other/roadmap' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Sdju/feod' }
    ]
  }
})
