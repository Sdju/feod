# Примеры для заявленных фреймворков

Все варианты показывают один FEOD Shop: каталог из трёх товаров, корзину
и редактируемый профиль. Состояние хранится в памяти приложения, а оформление
заказа очищает корзину. Сервера заказов, авторизации и оплаты в примерах нет.

| Фреймворк | Каталог в репозитории | Пакет workspace | Dev / проверка сборки |
| --- | --- | --- | --- |
| Vue | `examples/vue/spa` | `@open-feod/example-vue-spa` | 5174 / 4174 |
| React | `examples/react/spa` | `@open-feod/example-react-spa` | 5175 / 4175 |
| Svelte | `examples/svelte/spa` | `@open-feod/example-svelte-spa` | 5176 / 4176 |
| SvelteKit | `examples/svelte/kit` | `@open-feod/example-sveltekit` | 5177 / 4177 |
| Next | `examples/react/next` | `@open-feod/example-next` | 5178 / 4178 |
| Angular | `examples/angular/spa` | `@open-feod/example-angular-spa` | 5179 / 4179 |
| Nuxt | `examples/vue/nuxt` | `@open-feod/example-nuxt` | 5180 / 4180 |

## Запуск из checkout

Нужны Node.js 24.15 или новее в линейке 24 и pnpm из корневого `package.json`. Выполняйте команды
из корня репозитория; имя пакета берите из таблицы:

```sh
pnpm install --frozen-lockfile
pnpm --filter @open-feod/example-next... build
pnpm --filter @open-feod/example-next dev
```

Суффикс `...` сначала собирает локальные FEOD-плагины. Примеры используют
`configFromProject` из пакетов `0.1.5` и новее; в `0.1.0` его нет.

## Что сравнивать

Во всех вариантах логика `Product`, `Cart` и `User` находится в `modules`.
Внутренние файлы импортируются относительно своего модуля, другие модули
обращаются к ним через публичные `index.ts`. Корзина владеет собственным
типом позиции; зависимость `Product → Cart` односторонняя.

Страницы собирают интерфейс из модулей, а `app` подключает роутер,
провайдеры или сервисы. Общая кнопка и изображения находятся в `common`;
бизнес-состояние туда не вынесено. Настройки слоёв и алиасов описаны в README
каждого примера.

В Nuxt страницы фреймворка и есть слой `pages` FEOD. Файловый роутинг
совпадает с моделью страниц по умолчанию, а `dir.pages: '../pages'`
выносит их в `src/pages` рядом с `src/app`. В Next каталог `src/app`
одновременно маршрутизатор и слой `app`, а `src/pages` включил бы
Pages Router. Поэтому страницы FEOD лежат в `src/screens`
(`layerDirs.pages`), а `page.tsx` остаются тонкими адаптерами.
В SvelteKit слой `app` соответствует `src/routes`, остальные слои —
каталогам `src/lib`. Эти пути задаются общей конфигурацией FEOD
и проверяются обоими линтерами.

Vue и React SPA регистрируют маршруты вручную. В Next, Nuxt и SvelteKit
маршруты создаёт фреймворк; бизнес-логика остаётся в модулях. Состояние при SSR должно создаваться
для отдельного дерева приложения и не разделяться между запросами.

В Next, Nuxt и SvelteKit есть страница товара `/catalog/[id]`. На ней видно,
как связать SSR-фреймворк с FEOD. Маршрут получает параметр, загружает
данные и отдаёт 404. Компонент страницы в слое `pages` повторяет URL
(`catalog/[id]`): в Nuxt это сама страница, в Next и SvelteKit — компонент,
который рендерит маршрут фреймворка. У модуля `Product` два публичных входа, оба перечислены
в `modules.publicEntries`:

| Фреймворк | Серверный вход | Кто его вызывает | Чем защищена граница |
| --- | --- | --- | --- |
| Next | `server.ts` с `server-only` | Server Components, `generateMetadata` | `extra.confine` и ошибка сборки от `server-only` |
| Nuxt | `server.ts` | обработчики Nitro в `src/app/server`; страницы — через `useFetch` | `extra.confine` по `targets` |
| SvelteKit | `index.server.ts` | `+page.server.ts` | суффикс `.server` (проверяет сам Kit) |

В SPA-примерах серверного входа нет, данные каталога лежат в модуле.

## Проверки

После сборки для выбранного пакета запустите:

```sh
pnpm --filter @open-feod/example-next lint
pnpm --filter @open-feod/example-next lint:oxlint
pnpm --filter @open-feod/example-next test:architecture
pnpm --filter @open-feod/example-next exec playwright install chromium
CI=true pnpm --filter @open-feod/example-next test:e2e --project=chromium
```

Одна секция `feod` в `package.json` настраивает строгие правила обоих
линтеров. `test:architecture` проверяет допустимый публичный импорт
и намеренный приватный импорт реальными ESLint и Oxlint.
Запускайте эту команду отдельно от сборки и других линтеров: временный
компонент не должен попадать в их обход файлов.

Oxlint проверяет JavaScript/TypeScript и `<script>` в компонентах Vue/Svelte;
проверку шаблонов выполняют инструменты соответствующего фреймворка и ESLint.
Браузерные сценарии проверяют корзину, сохранение и отмену профиля,
мобильную раскладку на 390 px и навигацию. Точные команды production-запуска
и ограничения размещения указаны в README каждого варианта.
