# Vue и React SPA quick start

В репозитории есть два варианта одного демонстрационного магазина:
`examples/vue/spa` и `examples/react/spa`. В обоих есть главная страница,
каталог, корзина и редактируемый профиль. Данные хранятся в памяти;
«Оформить заказ» очищает корзину, без серверных заказов и оплаты.

## Установка и запуск

Нужны Node.js 24 и pnpm из корневого `package.json`. Команды выполняются
из корня checkout репозитория:

```sh
pnpm install --frozen-lockfile

# Vue
pnpm --filter @open-feod/example-vue-spa... build
pnpm --filter @open-feod/example-vue-spa dev

# React
pnpm --filter @open-feod/example-react-spa... build
pnpm --filter @open-feod/example-react-spa dev
```

Суффикс `...` включает сборку локальных пакетов линтеров перед приложением.
Примеры используют `configFromProject` из пакетов версии `0.1.5` и новее;
в `0.1.0` его нет.

## Слои и маршруты

Оба проекта используют `src/app`, `src/pages`, `src/modules`, `src/common`
и `src/globals`. Модули `Product`, `Cart` и `User` владеют своей логикой
и экспортируют публичный API через `index.ts`. Страницы собирают интерфейс
из модулей, а `app` подключает роутер и состояние приложения.

Маршруты регистрируются вручную в `app`: добавление файла в `pages`
само по себе не создаёт URL. Алиас `@/` указывает на `src/` и настроен
отдельно для Vite и TypeScript. Точные файлы настройки приведены в README
каждого примера.

Одна секция в `package.json` задаёт настройки обоим линтерам:

```json
{
  "feod": {
    "srcRoot": "src",
    "layerDirs": { "global": "globals" }
  }
}
```

ESLint и Oxlint загружают её через `configFromProject` с пресетом `strict`
и явно заданным корнем приложения. Подробнее — в
[контракте конфигурации](/linting/configuration).

## Публичные импорты и проверки

Компоненты `Product` обращаются к корзине через публичный API:

```ts
import { useCartStore } from '@/modules/Cart'
```

Прямой импорт `@/modules/Cart/store/cart` нарушает границу модуля.
Команда `test:architecture` проверяет допустимый и приватный импорт
на временном компоненте настоящими ESLint и Oxlint, затем удаляет его.

После сборки выполните команды для выбранного проекта:

```sh
pnpm --filter @open-feod/example-react-spa lint
pnpm --filter @open-feod/example-react-spa lint:oxlint
pnpm --filter @open-feod/example-react-spa test:architecture
pnpm --filter @open-feod/example-react-spa exec playwright install chromium
CI=true pnpm --filter @open-feod/example-react-spa test:e2e --project=chromium
```

Для Vue замените имя пакета на `@open-feod/example-vue-spa`.
Браузерные сценарии проверяют корзину, сохранение и отмену профиля,
а также работу на ширине 390 px без горизонтального переполнения.
Запускайте архитектурную проверку отдельно от сборки и других линтеров,
чтобы временный компонент не попал в их обход файлов.
