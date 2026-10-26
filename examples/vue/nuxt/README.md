# FEOD Shop на Nuxt

> ⚠️ **Пример сгенерирован AI** и может содержать неидиоматичный код, устаревшие приёмы и ошибки. Если вы знаете Vue и Nuxt, приглашаем помочь: откройте issue или pull request с исправлениями, чтобы пример соответствовал практикам фреймворка и правилам FEOD (см. [CONTRIBUTING](../../../CONTRIBUTING.md)).

Русскоязычный демонстрационный магазин на Nuxt 4 с серверным рендерингом. Каталог со страницей товара `/catalog/[id]`, профиль, корзина и виджеты разделены на FEOD-модули; Nuxt отвечает за нативные маршруты, SSR и гидрацию.

## Запуск

Нужны Node.js 24 и pnpm из корневого `package.json`. Команды выполняются
из корня чистого checkout:

```sh
pnpm install --frozen-lockfile
pnpm --filter @open-feod/example-nuxt... build
pnpm --filter @open-feod/example-nuxt dev
```

Dev-сервер доступен на `http://127.0.0.1:5180`, собранный SSR-сервер — на `http://127.0.0.1:4180`. Сборка `.output/server/index.mjs` рассчитана на Node.js server deployment: для production нужен запущенный Node-сервер с поддержкой SSR. Статический экспорт не включён. Данные профиля и корзины хранятся в Pinia только в состоянии текущего приложения и не переживают новую сессию браузера; здесь нет базы, аутентификации и оплаты. Каталог отдаёт небольшой API Nitro (`/api/products`).

## Слои и SSR

```text
src/
  app/                          # FEOD app = srcDir Nuxt
    app.vue, error.vue, layouts/, components/, styles/
    server/api/products/        # обработчики Nitro (serverDir = src/app/server)
  pages/                        # FEOD pages = страницы Nuxt (dir.pages = '../pages')
    index.vue, about.vue, cart.vue, profile.vue
    catalog/index.vue           # useFetch('/api/products')
    catalog/[id].vue            # useFetch, createError(404), useHead
  modules/
    Product/index.ts            # UI и типы
    Product/server.ts           # getProducts, getProduct — только для Nitro
    Cart/, User/                # Pinia-сторы, UI
  common/                       # MainButton, изображения
```

**Страницы Nuxt — это и есть слой `pages` FEOD.** Файловый роутинг Nuxt совпадает с моделью страниц FEOD по умолчанию: путь файла повторяет URL, `index.vue` отвечает за `/`, `[id].vue` — за параметр. Поэтому прослойка «адаптер маршрута → отдельный экран» не нужна. `srcDir: 'src/app'` оставляет в слое `app` только то, что относится к приложению целиком (`app.vue`, `error.vue`, layouts, компоненты оболочки, сервер). `dir.pages: '../pages'` выносит страницы в стандартный каталог FEOD `src/pages`, так что `layerDirs` переопределять не нужно. Страница — обычная страница Nuxt: `useHead`, `useFetch`, `useRoute`, `createError`, а интерфейс она собирает из модулей.

**Данные идут по штатному для Nuxt пути.** Обработчик Nitro вызывает серверный API модуля, страница получает данные через `useFetch`. Ответ типизирован по обработчику, и при SSR запрос выполняется внутри сервера без сетевого вызова. `serverDir` перенесён в `src/app/server`, поэтому обработчики тоже входят в слой `app` и проверяются FEOD. В `modules.publicEntries` перечислены `index.ts` и `server.ts`, а правило `extra.confine` (`targets: src/modules/*/server.ts`) разрешает серверный API только в `src/app/server`. Страница или компонент не может обойти HTTP-слой и затащить серверный код в клиентский бандл.

**Остальное — как обычно в Nuxt.** Auto-imports и авто-регистрация компонентов работают. Nuxt сканирует только `src/app` (`components/`, `composables/`), поэтому модули в `src/modules` явно импортируют свои зависимости и остаются переносимыми. Навигация идёт через `NuxtLink`, в том числе в виджетах модулей и в `MainButton` (проп `to`). Каждый запрос получает отдельный Pinia-контекст через `@pinia/nuxt`, поэтому SSR не делит пользовательские данные между запросами.

Суффикс `...` сначала собирает локальные FEOD-плагины. Новые API
`configFromProject` пока доступны из исходников и ещё не включены
в опубликованные пакеты `0.1.0`. Одна секция `feod` в `package.json`
задаёт обоим линтерам строгие правила с явным корнем приложения.

Для сборочных peer dependencies Nuxt явно выбраны Babel 8-плагины:
они согласованы с Babel 8 в его Vite/Nitro-инструментах. Глобальные
переопределения зависимостей workspace не используются.

## Проверки и production-запуск

После сборки выполните:

```sh
pnpm --filter @open-feod/example-nuxt type-check
pnpm --filter @open-feod/example-nuxt lint
pnpm --filter @open-feod/example-nuxt lint:oxlint
pnpm --filter @open-feod/example-nuxt test:architecture
pnpm --filter @open-feod/example-nuxt exec playwright install chromium
CI=true pnpm --filter @open-feod/example-nuxt test:e2e --project=chromium
```

Проверка архитектуры создаёт временные файлы в `Product`, `pages` и
`src/app/server` и удаляет их после запуска. Публичный `@/modules/Cart`
и `@/modules/Product/server` из обработчика Nitro проходят. Приватные
`store/cart` и `data` отклоняются `layer-imports`, а `server.ts` из страницы —
правилом `confine`. Запускайте эту
команду отдельно от сборки и других линтеров.

Playwright сам запускает production Node-сервер на свободном порту 4180.
Сценарии проверяют серверный HTML, корзину и виджеты, профиль,
мобильную раскладку, навигацию, API каталога и страницу товара с 404. Workflow `Nuxt example` выполняет
сборку, проверку типов, оба линтера, проверку границ и Chromium.

Для ручного просмотра production-сборки используйте отдельно:

```sh
pnpm --filter @open-feod/example-nuxt start
```
