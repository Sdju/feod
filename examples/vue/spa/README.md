# FEOD Vue SPA

Демонстрационный магазин на Vue 3: каталог, добавление товаров и корзина.
Архитектурные границы проверяются ESLint и Oxlint по общей конфигурации FEOD.
Кнопка «Оформить заказ» очищает корзину; серверных заказов и оплаты в примере нет.

## Запуск из чистого checkout

Нужны Node.js 24 и pnpm, указанный в корневом `package.json`.
Все команды ниже выполняются **из корня репозитория**:

```sh
pnpm install --frozen-lockfile
pnpm --filter @open-feod/example-vue-spa... build
pnpm --filter @open-feod/example-vue-spa dev
```

Сборка с `...` сначала собирает workspace-плагины, затем проверяет типы и
собирает приложение. Это нужно перед первым запуском линтеров: пример использует
новые API локальных пакетов, которых пока нет в опубликованной версии `0.1.0`.

## Структура

```text
src/
  app/       # запуск, роутер, лейауты
  pages/     # компоненты страниц
  modules/   # Product, Cart, User с публичными index.ts
  common/    # общие компоненты и ассеты
  globals/   # глобальные типы
```

Файлы в `src/pages` повторяют URL (`catalog.vue` → `/catalog`, `index.vue` → `/`),
но файловый роутинг не используется: маршруты вручную зарегистрированы в
`src/app/router.ts` с ленивой загрузкой, новый файл страницы нужно добавить туда.

В `package.json` задана общая конфигурация:

```json
{
  "feod": {
    "srcRoot": "src",
    "layerDirs": { "global": "globals" }
  }
}
```

`eslint.config.js` и `oxlint.config.ts` загружают её через `configFromProject`
с пресетом `strict` и явно заданным корнем приложения. В ESLint отдельно
подключены парсеры TypeScript и Vue. Правила FEOD применяются к исходникам;
конфигурационные файлы и E2E-тесты не являются слоями приложения.

## Проверки

```sh
pnpm --filter @open-feod/example-vue-spa lint
pnpm --filter @open-feod/example-vue-spa lint:oxlint
pnpm --filter @open-feod/example-vue-spa test:architecture
```

Оба lint-командных сценария проверяют исходники без изменений файлов.
Автоисправления ESLint запускаются отдельно:

```sh
pnpm --filter @open-feod/example-vue-spa lint:fix
```

### Пример нарушения границы модуля

Компонент модуля `Product` может использовать публичный API `Cart`:

```ts
import { useCartStore } from '@/modules/Cart'
```

Импорт приватного store нарушает границу:

```ts
import { useCartStore } from '@/modules/Cart/store/cart'
```

`test:architecture` создаёт временный Vue-компонент внутри `Product`, проверяет
оба импорта настоящими линтерами и удаляет компонент. Для приватного импорта
ESLint сообщает `feod-structure/layer-imports`, Oxlint —
`feod-structure(layer-imports)`. Команда проходит только если публичный импорт
разрешён и оба линтера обнаружили приватный. Запускайте её после сборки и
отдельно от других проверок, чтобы временный компонент не попал в их обход файлов.

## Модульные тесты

Тесты лежат внутри модулей (`src/modules/*/__tests__`) и проверяют модуль
изолированно: стор `Cart` и карточку `Product`, которая работает с корзиной
только через публичный API `@/modules/Cart`.

```sh
pnpm --filter @open-feod/example-vue-spa test:unit --run
```

## Браузерный сценарий

После сборки установите Chromium и запустите проверку production-сборки:

```sh
pnpm --filter @open-feod/example-vue-spa exec playwright install chromium
CI=true pnpm --filter @open-feod/example-vue-spa test:e2e --project=chromium
```

Тест запускает preview на порту 4174 в headless-режиме. Он проверяет переход
с главной в каталог, добавление товара, открытие корзины, изменение количества,
пересчёт суммы и очистку корзины, редактирование и отмену изменений профиля.
Дополнительный сценарий на ширине 390 px проверяет навигацию и корзину без
горизонтального переполнения. Все сценарии проверяют отсутствие необработанных
ошибок страницы.
Порт должен быть свободен; существующий сервер не переиспользуется.

Для просмотра теста в браузере используйте `test:e2e --project=chromium` без
`CI=true`: Playwright запустит dev-сервер на порту 5174. Этот порт тоже должен
быть свободен. Дополнительно можно установить Firefox/WebKit и запустить
остальные настроенные браузеры.

Workflow `Test Vue example` выполняет сборку, оба lint-сценария, проверку
границ и браузерный сценарий Chromium при изменениях примера или плагинов.
При ошибке он сохраняет Playwright report и результаты тестов.
