# Next.js App Router — FEOD Shop

> ⚠️ **Пример сгенерирован AI** и может содержать неидиоматичный код, устаревшие приёмы и ошибки. Если вы знаете React и Next.js, приглашаем помочь: откройте issue или pull request с исправлениями, чтобы пример соответствовал практикам фреймворка и правилам FEOD (см. [CONTRIBUTING](../../../CONTRIBUTING.md)).

Демонстрационный магазин на Next.js 16 App Router, React и TypeScript. Страницы, товары, оформление и базовый стиль совпадают с React SPA и Vue SPA: `/`, `/catalog`, `/cart`, `/profile`, `/about`; в каталоге три товара, общие корзина и профиль. Дополнительно есть страница товара `/catalog/[id]`: на ней видно, как динамический маршрут Next сочетается со слоями FEOD.

## Запуск из чистого checkout

Требуются Node.js 24 и pnpm из корневого `package.json`. Команды выполняются из корня чистого checkout:

```sh
pnpm install --frozen-lockfile
pnpm --filter @open-feod/example-next... build
pnpm --filter @open-feod/example-next dev
```

Откройте http://127.0.0.1:5178. Production server использует порт 4178:

```sh
pnpm --filter @open-feod/example-next start
```

Суффикс `...` сначала собирает локальные FEOD-плагины. Новые API
`configFromProject` пока доступны из исходников и ещё не включены
в опубликованные пакеты `0.1.0`.

## Структура

```text
src/
  app/                        # FEOD app = Next App Router
    layout.tsx                # root layout: html/body, шаблон metadata, providers, shell
    page.tsx                  # route adapters: metadata, params, 404 → экран
    catalog/page.tsx
    catalog/[id]/page.tsx     # generateStaticParams, generateMetadata, notFound
    not-found.tsx, error.tsx  # файловые конвенции Next
    _providers/               # клиентская граница с providers модулей
    _shell/                   # шапка, навигация, подвал
    _styles/                  # глобальные стили
  screens/                    # FEOD pages (layerDirs.pages = "screens")
    catalog.tsx               # /catalog
    catalog/[id].tsx          # /catalog/[id]
  modules/
    Product/
      index.ts                # публичный API для любой среды: UI и типы
      server.ts               # публичный серверный API: getProducts, getProduct
    Cart/, User/              # состояние в React Context, UI, публичный index.ts
  common/                     # MainButton
  globals/                    # глобальные декларации типов
```

## Как Next и FEOD делят ответственность

**`src/app` — одновременно App Router и слой `app` FEOD.** Next отдаёт этому каталогу маршрутизацию, корневой layout и файловые конвенции, FEOD — запуск и сборку приложения. Это одна и та же роль, поэтому слой не дублируется. Нестраничный код `app` лежит в приватных папках `_providers`, `_shell` и `_styles`. Next исключает такие папки из маршрутизации, и тот же префикс `_` FEOD использует для приватных модулей страниц.

**`page.tsx` — адаптер маршрута, а не страница.** Адаптер отвечает за то, что принадлежит роутеру: `metadata` и `generateMetadata`, `params`, `generateStaticParams`, `notFound()`, настройки сегмента. Затем он рендерит экран из `src/screens`. Для `/catalog/[id]` адаптер по `params` получает товар через серверный API модуля, при отсутствии вызывает `notFound()` и передаёт товар экрану. `cache()` в модуле убирает повторное чтение в `generateMetadata` и `Page`.

**`src/screens` — слой `pages` FEOD.** Каталог `src/pages` в Next включил бы Pages Router, поэтому слой переименован через `layerDirs.pages`. Экраны повторяют URL (`screens/catalog/[id].tsx` ↔ `/catalog/[id]`), и компонент страницы легко найти по адресу. Экраны — Server Components: собирают интерфейс из модулей и могут загружать данные (`screens/catalog.tsx` вызывает `getProducts()`). Стили экран подключает сам (`home.tsx` → `home.scss`).

**Модуль публикует два входа.** `index.ts` безопасен для сервера и клиента: компоненты и типы. `server.ts` начинается с `import "server-only"` и содержит доступ к данным. Оба файла перечислены в `modules.publicEntries`, поэтому `@/modules/Product/server` — разрешённый публичный импорт, а `@/modules/Product/data` — нарушение границы. Правило `extra.confine` разрешает `server-only`, `next/headers` и `next/cache` только в `src/app` и серверных входах модулей. Так граница «сервер/клиент» проверяется тем же линтером, что и слои.

**`"use client"` ставится на листьях.** Клиентские файлы — providers, `NavLinks` (подсветка через `usePathname`), формы и виджеты с состоянием, `AddToCartButton`. `ProductList`, `ProductCard`, `ProductDetails`, `ShopShell` и экраны остаются серверными. Модули свободно используют `next/link` и `next/image`: это обычные зависимости, они не нарушают правила слоёв.

**Конфигурация Next помогает FEOD.** `typedRoutes` проверяет ссылки модулей (`href="/cart"`, `` `/catalog/${id}` ``) по реальным маршрутам `app` без импорта слоя `app`. `PageProps<"/catalog/[id]">` и `LayoutProps<"/">` генерируются `next typegen`. `@next/eslint-plugin-next` (core-web-vitals) работает вместе с правилами FEOD в одном конфиге ESLint.

## Конфигурация FEOD

```json
{
  "feod": {
    "srcRoot": "src",
    "layerDirs": { "pages": "screens", "global": "globals" },
    "modules": { "publicEntries": ["index.ts", "server.ts"] },
    "extra": {
      "confine": [{
        "name": "server-only",
        "imports": ["server-only", "next/headers", "next/cache"],
        "allowedIn": ["src/app/**", "src/modules/*/server.ts", "src/modules/*/server/**"]
      }]
    }
  }
}
```

Оба линтера читают её через `configFromProject({ rootDir, preset: "strict" })`.

## Проверки

```sh
pnpm --filter @open-feod/example-next type-check
pnpm --filter @open-feod/example-next lint
pnpm --filter @open-feod/example-next lint:oxlint
pnpm --filter @open-feod/example-next test:architecture
pnpm --filter @open-feod/example-next exec playwright install chromium
CI=true pnpm --filter @open-feod/example-next test:e2e --project=chromium
```

Архитектурная проверка создаёт временные TSX-файлы в `Product` и `screens` и прогоняет настоящие ESLint и Oxlint: публичные `@/modules/Cart` и `@/modules/Product/server` разрешены, приватные `store/cart` и `data` отклоняются `layer-imports`, а `server-only` вне `app` и `server.ts` — правилом `confine`. Запускайте её отдельно от сборки и других линтеров. E2E проверяет SSR-разметку, страницу товара (`params`, `generateMetadata`, 404), корзину, профиль, подсветку навигации, заголовки, прямые URL, history и ширину 390px. Playwright сам запускает production-сервер, поэтому порт 4178 должен быть свободен.

## Рендеринг и размещение

`next build` пререндерит все маршруты, включая `/catalog/1…3` из `generateStaticParams`. Корзина и профиль живут в React Context: состояние создаётся отдельно для каждого дерева, на сервере не разделяется между запросами и сбрасывается после полной перезагрузки страницы. Это учебное демо без базы, авторизации, заказов и платежей. Подходят Node.js server и Docker; статический export ограничивает серверные возможности App Router. См. документацию Next.js [о deployment](https://nextjs.org/docs/app/getting-started/deploying).
