# Angular SPA — FEOD Shop

Запускаемый Angular 22 + TypeScript пример магазина с теми же страницами и сценариями, что и [Vue SPA](../../vue/spa/README.md) и [React SPA](../../react/spa/README.md). Он показывает явную таблицу маршрутов, standalone-компоненты, модульные публичные API и локальные правила FEOD.

Корзина и профиль хранятся сигналами в сервисах Angular и сбрасываются после перезагрузки страницы. Кнопка «Оформить заказ» только очищает корзину. Серверной части, авторизации, сохранения данных, реального заказа и оплаты в примере нет; каталог содержит три демонстрационных товара.

## Запуск из чистого checkout

Нужны Node.js 24.15 или новее в линейке 24 и pnpm 10.22.0 из корневого `package.json`. Все команды выполняются **из корня репозитория**:

```sh
pnpm install --frozen-lockfile
pnpm --filter @open-feod/example-angular-spa... build
pnpm --filter @open-feod/example-angular-spa dev
```

Dev-сервер открывается на http://127.0.0.1:5179. Angular CLI использует порт 5179; если порт уже занят, освободите его перед запуском. Production preview использует порт 4179:

```sh
pnpm --filter @open-feod/example-angular-spa preview
```

`ng build` через Angular CLI применяет `@angular/build:application`, проверяет TypeScript и Angular-шаблоны и создаёт `dist/example-angular-spa/browser`. Vite здесь только раздаёт готовые статические файлы для локального preview и E2E. При размещении на статическом сервере неизвестные URL нужно перенаправлять на `index.html` для прямого входа в SPA-маршруты.

## Структура и границы

```text
src/
  app/       # bootstrap, явная таблица Angular Router, layout
  pages/     # home, catalog, cart, profile, about и 404
  modules/
    Product/ # каталог и карточки; использует публичный API Cart
    Cart/    # signal-сервис корзины, CartView и CartWidget
    User/    # signal-сервис профиля, UserProfile и UserWidget
  common/    # кнопка и статические изображения
  globals/   # общие типы внешних ресурсов
```

Компоненты standalone, а маршруты вручную зарегистрированы в `src/app/app.routes.ts`: новый файл страницы нужно добавить в эту таблицу. `CartService` и `UserService` инжектируются через Angular DI и держат состояние только в памяти. Состояние товара отделено от каталога: Cart владеет собственным типом `CartItem`, Product передаёт совместимую структуру через публичный API Cart.

В `package.json` задана общая конфигурация FEOD:

```json
{
  "feod": {
    "srcRoot": "src",
    "layerDirs": { "global": "globals" }
  }
}
```

ESLint и Oxlint вызывают `configFromProject({ rootDir, preset: 'strict' })` с явным корнем примера. ESLint отдельно разбирает TypeScript, inline-компонентные шаблоны и внешние Angular HTML-шаблоны через `angular-eslint`. FEOD-проверки работают по импортам TypeScript в `src`; Oxlint проверяет те же границы для исходного TypeScript. Angular-парсер нужен ESLint для проверки Angular-синтаксиса и доступности в HTML-шаблонах.

```sh
pnpm --filter @open-feod/example-angular-spa lint
pnpm --filter @open-feod/example-angular-spa lint:oxlint
pnpm --filter @open-feod/example-angular-spa test:architecture
```

Оба линтера выполняются без изменения файлов; `lint:fix` запускается отдельно. Проверка архитектуры временно создаёт настоящий standalone TypeScript-компонент внутри Product, проверяет публичный и приватный импорты реальными ESLint и Oxlint и удаляет компонент. Запускайте её отдельно от параллельной сборки.

```ts
// Разрешено: публичный API другого модуля.
import { CartService } from '@/modules/Cart'

// Оба линтера должны отклонить приватный импорт.
import { CartService } from '@/modules/Cart/store/cart.service'
```

Конфиги используют новый `configFromProject`, который входит в исходники workspace-плагинов, но ещё не опубликован в их npm-версии `0.1.0`. Сначала соберите plugin dependencies командой выше; локальные проверки выполняются с кодом текущего checkout.

## Chromium

После production-сборки установите браузер и запустите тесты:

```sh
pnpm --filter @open-feod/example-angular-spa exec playwright install chromium
CI=true pnpm --filter @open-feod/example-angular-spa test:e2e --project=chromium
```

Playwright использует отдельный headless Chromium и запускает production preview на порту 4179. Четыре сценария проверяют добавление/количество/удаление/очистку корзины и её виджет, сохранение и отмену профиля, маршруты без переполнения на 390px и прямой вход, заголовки и историю браузера. Тесты также ловят необработанные ошибки страницы; запущенный пользовательский Chromium для них не переиспользуется.

Workflow `.github/workflows/test-angular-example.yml` устанавливает зависимости из lock-файла, собирает Angular-приложение и workspace-плагины, запускает оба линтера, проверку FEOD-границ и E2E Chromium. При ошибке загружаются Playwright report и результаты тестов.
