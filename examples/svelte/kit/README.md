# FEOD Shop на SvelteKit

Демонстрационный магазин на Svelte 5, SvelteKit и TypeScript с серверным рендерингом через `@sveltejs/adapter-node`. Есть главная, каталог, страница товара `/catalog/[id]`, корзина, профиль и страница проекта. Корзина и профиль хранятся в памяти браузера; после обновления страницы состояние возвращается к исходному. Здесь нет базы данных, аккаунтов, реальных заказов и оплаты.

## Запуск из чистого checkout

Нужны Node.js 24 и pnpm из корневого `package.json`. Команды выполняются из корня репозитория:

```sh
pnpm install --frozen-lockfile
pnpm --filter @open-feod/example-sveltekit... build
pnpm --filter @open-feod/example-sveltekit dev
```

Dev-сервер работает на http://localhost:5177. После сборки Node adapter запускается так:

```sh
pnpm --filter @open-feod/example-sveltekit preview
```

Для самостоятельного production-запуска перейдите в `examples/svelte/kit` и выполните `node build/index.js`; адрес и порт задаются переменными окружения `HOST` и `PORT`. Платформенный адаптер для Vercel/Netlify/другого хоста нужно выбрать и настроить отдельно.

Суффикс `...` сначала собирает локальные FEOD-плагины. Новые API
`configFromProject` пока доступны из исходников и ещё не включены
в опубликованные пакеты `0.1.0`.

## Структура и SSR-состояние

```text
src/
  routes/                       # FEOD app = маршруты SvelteKit
    catalog/+page.server.ts       # load: данные маршрута из серверного API модуля
    catalog/[id]/+page.server.ts  # load + error(404)
    catalog/[id]/+page.svelte     # <svelte:head> и экран
    _components/                  # шапка и подвал (не маршруты)
  lib/
    pages/                        # FEOD pages: повторяют URL (catalog/[id].svelte)
    modules/
      Product/index.ts          # UI и типы для любой среды
      Product/index.server.ts   # getProducts, getProduct — только сервер
      Cart/, User/              # состояние на рунах и context
    common/                     # кнопка, стили и изображения
    globals/                    # глобальные типы
```

### Как SvelteKit и FEOD делят ответственность

- `src/routes` — одновременно маршрутизатор Kit и слой `app` FEOD. `+page.server.ts` получает данные маршрута (`params`, `error(404)`), `+page.svelte` задаёт `<svelte:head>` и передаёт данные экрану из `lib/pages`.
- Модуль публикует два входа, оба перечислены в `modules.publicEntries`: `index.ts` и `index.server.ts`. Суффикс `.server` — штатная граница SvelteKit: такой файл нельзя импортировать в клиентский код, сборка упадёт. Поэтому отдельное правило `confine` здесь не нужно — его роль выполняет сам Kit, а FEOD следит, чтобы снаружи импортировались только эти два файла.
- Ссылки строятся штатным `resolve()`, в том числе типизированным `resolve('/catalog/[id]', { id })` внутри модуля.

Маршруты `+page.svelte` только подключают компоненты `lib/pages`; бизнес-логика находится в модулях. `+layout.svelte` при создании component tree создаёт отдельные экземпляры Cart и User и устанавливает их через Svelte context. Сторы — классы на рунах (`*.svelte.ts`) внутри модулей; экземпляры создаёт `provide*()`, module-level singleton не экспортируется. Поэтому SSR-запросы не разделяют состояние между деревьями компонентов. После гидратации изменения работают в пределах вкладки и не сохраняются после следующей полной загрузки.

FEOD использует `srcRoot: "src"`, слой `app: "routes"`, слои страниц и модулей из `src/lib`, а `aliasRoot: "src/lib"` согласован с Vite/TypeScript алиасом `@/`. ESLint и Oxlint загружают общую конфигурацию с preset `strict` и явным корнем. ESLint проверяет Svelte-разметку и скрипты; ссылки в модулях, страницах и layout строятся штатным `resolve()` из `$app/paths`, поэтому правило `svelte/no-navigation-without-resolve` включено без исключений. Заголовок каждой страницы задаёт её `+page.svelte` через `<svelte:head>`. Oxlint проверяет Svelte script blocks; его парсер пока не анализирует markup. `svelte-check`, production-сборка и Playwright проверяют компоненты и поведение в браузере.

```sh
pnpm --filter @open-feod/example-sveltekit lint
pnpm --filter @open-feod/example-sveltekit lint:oxlint
pnpm --filter @open-feod/example-sveltekit test:architecture
```

Граничная проверка временно добавляет компоненты в Product и в `lib/pages` и прогоняет оба настоящих линтера: публичные `@/modules/Cart` и `@/modules/Product/index.server` проходят, приватные `@/modules/Cart/store/cart.svelte` и `@/modules/Product/data` завершаются FEOD-ошибкой.

## Проверка Chromium

```sh
pnpm --filter @open-feod/example-sveltekit exec playwright install chromium
CI=true pnpm --filter @open-feod/example-sveltekit test:e2e --project=chromium
```

Playwright проверяет каталог, корзину, виджет, профиль, labels, глубокие ссылки и title, историю браузера, отдельное SSR-представление в независимых контекстах и ширину 390 px без горизонтального переполнения. Тестовый preview запускается Node adapter на 4177, а обычный dev-сервер использует 5177.
