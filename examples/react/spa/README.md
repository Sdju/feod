# React SPA — FEOD Shop

Запускаемый React + TypeScript + Vite пример с теми же страницами, товарами и оформлением, что и [Vue SPA](../../vue/spa/README.md). Показывает разделение app/pages/modules/common/globals, публичные API модулей и проверку границ двумя линтерами.

Корзина и профиль хранятся в памяти: перезагрузка страницы сбрасывает данные. «Оформить заказ» только очищает корзину. Здесь нет сервера, авторизации, реальных заказов или платежей; тексты о доставке и ассортименте демонстрационные.

## Запуск из чистого checkout

Нужны Node.js 24 и pnpm из `packageManager` корневого package.json. Все команды ниже выполняются **из корня репозитория**:

```sh
pnpm install --frozen-lockfile
pnpm --filter @open-feod/example-react-spa... build
pnpm --filter @open-feod/example-react-spa dev
```

Открыть http://localhost:5175. Порт занят — команда завершится ошибкой. Preview использует отдельный порт 4175:

```sh
pnpm --filter @open-feod/example-react-spa preview
```

Сначала собираются workspace-плагины, затем проверяются типы и собирается приложение. Пример использует новые `configFromProject` API из исходников: опубликованная npm-версия плагинов 0.1.0 их ещё не содержит. Для отдельных приложений эти API будут доступны после следующего релиза пакетов.

## Структура

```text
src/
  app/       # entry, явная таблица маршрутов, layout и подключение providers
  pages/     # home, catalog, cart, profile, about
  modules/
    Product/ # каталог и карточки товаров
    Cart/    # состояние корзины, CartProvider, useCartStore, CartView/CartWidget
    User/    # состояние профиля, UserProvider, useUserStore, UserProfile/UserWidget
  common/    # универсальная кнопка и изображения
  globals/   # глобальные декларации типов
```

React Context и useState находятся внутри Cart и User; providers подключает app/layout/Layout.tsx. Страницы и layout импортируют модули только через `index.ts`. Product использует публичный `useCartStore` из Cart. Обратной зависимости Cart → Product нет: Cart владеет собственным типом CartItem. Универсальный common не хранит состояние бизнеса.

Маршруты `/`, `/catalog`, `/cart`, `/profile`, `/about` заданы вручную в `src/app/router.tsx` через React Router, без генерации из файлов. Link/NavLink и useNavigate поддерживают обычные ссылки и историю назад/вперёд. Неизвестный путь показывает «Страница не найдена». Для размещения на статическом хостинге требуется перенаправление SPA-маршрутов на index.html. Vite dev/preview уже поддерживают прямой вход по этим адресам.

Алиас `@/` указывает на src и согласован в tsconfig.json и vite.config.ts. Стили страницы подключает сама страница (`home.tsx` → `home.scss`), правило `layer-imports` разрешает странице импортировать собственные стили. Внутренние SCSS модулей находятся рядом с компонентами.

## Одна конфигурация FEOD для ESLint и Oxlint

```json
{
  "feod": {
    "srcRoot": "src",
    "layerDirs": { "global": "globals" }
  }
}
```

Оба конфига используют `configFromProject({ rootDir, preset: 'strict' })` с явно заданным корнем примера. TypeScript/JSX и React Hooks проверяет ESLint; FEOD правила применяются только к src. Oxlint использует те же правила границ и ту же секцию feod. Конфиги сборки и e2e не объявляются слоями приложения.

```sh
pnpm --filter @open-feod/example-react-spa lint
pnpm --filter @open-feod/example-react-spa lint:oxlint
pnpm --filter @open-feod/example-react-spa test:architecture
```

`lint` ничего не меняет; исправления запускаются отдельно через `lint:fix`. Проверка архитектуры создаёт временный TSX файл внутри Product, запускает настоящие ESLint и Oxlint и удаляет файл в finally. Запускайте её последовательно с остальными проверками, чтобы временный файл не попал в сборку.

```ts
// Разрешено: публичный API другого модуля.
import { useCartStore } from "@/modules/Cart";
// Оба линтера отклоняют: приватная реализация другого модуля.
import { useCartStore } from "@/modules/Cart/store/cart";
```

## Проверка в Chromium

После сборки установите Chromium и запустите тесты:

```sh
pnpm --filter @open-feod/example-react-spa exec playwright install chromium
CI=true pnpm --filter @open-feod/example-react-spa test:e2e --project=chromium
```

Playwright запускает отдельный headless Chromium и собственный preview на свободном 4175. Проверяются добавление/количество/удаление/очистка корзины, сохранение и отмена профиля с обновлением виджета, навигация, прямые URL и история браузера, отсутствие горизонтального скролла на 390px и ошибок страницы. Браузер тестов запускается в отдельном профиле; разные порты позволяют проверять примеры независимо.

Workflow `.github/workflows/test-react-example.yml` собирает плагины и приложение, запускает оба линтера, проверку границ и Chromium. При ошибке сохраняются playwright-report и test-results.
