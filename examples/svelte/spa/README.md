# FEOD Shop на Svelte SPA

> ⚠️ **Пример сгенерирован AI** и может содержать неидиоматичный код, устаревшие приёмы и ошибки. Если вы знаете Svelte, приглашаем помочь: откройте issue или pull request с исправлениями, чтобы пример соответствовал практикам фреймворка и правилам FEOD (см. [CONTRIBUTING](../../../CONTRIBUTING.md)).

Демонстрационный магазин на Svelte 5, TypeScript и Vite. В нём есть главная, каталог, корзина, профиль и страница проекта. Данные корзины и профиля живут в памяти вкладки: обновление страницы возвращает исходные значения. Оформление заказа очищает корзину; сервера заказов, авторизации и оплаты нет.

## Запуск из чистого checkout

Нужны Node.js 24 и pnpm из корневого `package.json`. Команды выполняются из корня репозитория:

```sh
pnpm install --frozen-lockfile
pnpm --filter @open-feod/example-svelte-spa... build
pnpm --filter @open-feod/example-svelte-spa dev
```

SPA откроется на http://localhost:5176. Production preview работает на 4176:

```sh
pnpm --filter @open-feod/example-svelte-spa preview
```

`build` сначала проверяет Svelte-компоненты и типы командой `svelte-check`, затем собирает приложение.

Суффикс `...` сначала собирает локальные FEOD-плагины. Новые API
`configFromProject` пока доступны из исходников и ещё не включены
в опубликованные пакеты `0.1.0`.

## FEOD и состояние

```text
src/
  app/       # точка входа, layout, стили
  pages/     # страницы и связи с бизнес-модулями
  modules/   # Product, Cart, User и их публичные index.ts
  common/    # кнопка и ассеты
  globals/   # глобальные типы
```

`App.svelte` владеет маршрутизацией SPA и создаёт экземпляры Cart и User. Состояние модулей — классы на рунах Svelte 5 (`store/*.svelte.ts`); модули публикуют его создание и доступ через context; Product получает Cart через `@/modules/Cart`. Общего изменяемого singleton-состояния нет.

Конфигурация FEOD указана в `package.json` с `srcRoot: "src"`, `layerDirs.global: "globals"`. ESLint и Oxlint читают её через `configFromProject` с preset `strict` и явно заданным корнем проекта. ESLint разбирает Svelte markup и TypeScript-блоки через `eslint-plugin-svelte` и TypeScript parser. Oxlint проверяет TypeScript и скрипты внутри `.svelte`; его текущий Svelte parser не проверяет markup, поэтому доступность и шаблоны дополнительно проверяют `svelte-check`, сборка и браузерные тесты.

```sh
pnpm --filter @open-feod/example-svelte-spa lint
pnpm --filter @open-feod/example-svelte-spa lint:oxlint
pnpm --filter @open-feod/example-svelte-spa test:architecture
```

`test:architecture` создаёт временный Svelte-компонент Product с каждым из двух импортов и запускает настоящие ESLint и Oxlint. Оба движка разрешают публичный `@/modules/Cart` и отклоняют приватный `@/modules/Cart/store/cart.svelte`; файл всегда удаляется после проверки.

## Проверка Chromium

```sh
pnpm --filter @open-feod/example-svelte-spa exec playwright install chromium
CI=true pnpm --filter @open-feod/example-svelte-spa test:e2e --project=chromium
```

Сценарии проверяют корзину и виджет, изменение количества, удаление и очистку, редактирование/сохранение/отмену профиля, подписи полей, глубокие ссылки, заголовок страницы, историю назад/вперёд, ошибки и отсутствие горизонтального переполнения при ширине 390 px. Playwright запускает preview на 4176; интерактивный локальный запуск использует dev-сервер на 5176.
