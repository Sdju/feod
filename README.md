# Open FEOD

[![Docs](https://img.shields.io/badge/docs-feod.dev-blue)](https://feod.dev)
[![eslint plugin](https://npmx.dev/api/registry/badge/version/@o-feod/eslint-structure-plugin)](https://npmx.dev/package/@o-feod/eslint-structure-plugin)
[![oxlint plugin](https://npmx.dev/api/registry/badge/version/@o-feod/oxlint-structure-plugin)](https://npmx.dev/package/@o-feod/oxlint-structure-plugin)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

![FEOD Logo](docs/public/feod-full-logo.svg)

**FEOD** (Fractal Entity Oriented Design) — методология организации структуры фронтенд-приложений. Она сочетает слоистый и модульный подходы: небольшой набор слоёв с понятными правилами импорта и модули, которые можно вкладывать друг в друга на любую глубину.

**Open FEOD** — открытая версия методологии с документацией, линтерами для проверки правил и запускаемыми примерами. Из неё убраны решения, специфичные для конкретных компаний.

> **Статус: бета.** Пакеты выпускаются с версиями `0.x`, правила и формат конфигурации могут меняться. Обратная связь очень помогает: см. [участие в проекте](#-участие-в-проекте).

**Документация: [feod.dev](https://feod.dev)** · [Roadmap](docs/other/roadmap.md) · [Статья на Хабре](https://habr.com/ru/companies/sportmaster_lab/articles/972410/)

## 🎯 Основные концепции

- **Модуль** — независимая часть проекта со своим публичным API (`index.ts`) и правилами. Модуль можно рассматривать как внутреннюю зависимость.
- **Фрактальность** — модули могут содержать подмодули без ограничения глубины, а страницы и роуты могут жить внутри модулей.
- **Сущность-ориентированность** — каждый файл и директория имеет определённую роль, поэтому назначение и ограничения любой части проекта понятны сразу.

## 📁 Структура проекта

```
src/
├── app/          # Запуск и настройка приложения
├── pages/        # Страницы приложения
├── modules/      # Модули бизнес-логики
├── common/       # Общие переиспользуемые сущности
└── globals/      # Глобальные сущности (опционально)
```

Цепочка зависимостей: **common** ➜ **modules** ➜ **pages** ➜ **app**.

- **common** не зависит от других слоёв и может импортироваться везде.
- **modules** импортируют `common` и другие модули только через публичный API.
- **pages** импортируют `common` и `modules`.
- **app** импортирует всё и сам не импортируется никем.
- **globals** нигде не импортируется: там объявляются и расширяются глобальные сущности.

Подробнее: [введение](https://feod.dev/base/), [структура проекта](https://feod.dev/structure/), [сравнение с FSD, Atomic Design и другими подходами](https://feod.dev/base/comparison).

## 🚀 Быстрый старт

Правила FEOD проверяются линтером. Выберите ESLint или Oxlint:

```sh
# ESLint
pnpm add -D @o-feod/eslint-structure-plugin

# Oxlint
pnpm add -D oxlint @o-feod/oxlint-structure-plugin
```

Минимальная настройка ESLint (flat config):

```js
// eslint.config.js
import feodStructure from "@o-feod/eslint-structure-plugin";

export default [
  {
    plugins: { "feod-structure": feodStructure },
    ...feodStructure.configs.recommended,
  },
];
```

Расположение слоёв и выбранные варианты структуры задаются в секции `feod` файла `package.json` или в `feod.config.json`; обе формы описаны JSON Schema. Подробности и настройка Oxlint:

- [ESLint-плагин](https://feod.dev/tools/eslint-plugin)
- [Oxlint-плагин](https://feod.dev/tools/oxlint-plugin)
- [Конфигурация FEOD](https://feod.dev/tools/feod-config)

## 📦 Пакеты

| Пакет | Описание |
| --- | --- |
| [`@o-feod/eslint-structure-plugin`](packages/eslint) | Правила FEOD для ESLint: слои, публичный API модулей, подмодули, циклы, структура файлов |
| [`@o-feod/oxlint-structure-plugin`](packages/oxlint) | Те же правила для Oxlint через тонкий адаптер |

## 🧩 Примеры

В [`examples/`](examples/) лежит один и тот же магазин FEOD Shop (каталог, корзина, профиль) на разных фреймворках. Каждый пример собирается, проходит ESLint и Oxlint и проверяется e2e-тестами в Chromium.

| Фреймворк | Каталог |
| --- | --- |
| Vue | [`examples/vue/spa`](examples/vue/spa) |
| Nuxt | [`examples/vue/nuxt`](examples/vue/nuxt) |
| React | [`examples/react/spa`](examples/react/spa) |
| Next | [`examples/react/next`](examples/react/next) |
| Angular | [`examples/angular/spa`](examples/angular/spa) |
| Svelte | [`examples/svelte/spa`](examples/svelte/spa) |
| SvelteKit | [`examples/svelte/kit`](examples/svelte/kit) |

Команды запуска и размещение файлов каждого варианта — в [матрице фреймворков](docs/examples/frameworks.md).

## 🤖 AI-агенты

В репозитории есть Agent Skill для FEOD: [`.cursor/skills/feod`](.cursor/skills/feod). Он помогает агентам создавать структуру проекта, подключать плагины, разбирать ошибки линтера и чинить нарушения.

## 🛠️ Разработка

Репозиторий — [pnpm workspace](https://pnpm.io/workspaces) (документация, пакеты, примеры). Нужен Node.js 24 и pnpm версии из `packageManager` в корневом `package.json`.

```sh
pnpm install --frozen-lockfile

# Документация (VitePress)
pnpm dev
pnpm build

# Тесты плагинов
pnpm --filter @o-feod/eslint-structure-plugin test
pnpm --filter @o-feod/oxlint-structure-plugin test

# Любой пример: сначала собрать локальные плагины (суффикс `...`), затем запустить
pnpm --filter @open-feod/example-react-spa... build
pnpm --filter @open-feod/example-react-spa dev
```

Имена пакетов и порты примеров — в [матрице фреймворков](docs/examples/frameworks.md). Выпуск пакетов описан в [`packages/PUBLISHING.md`](packages/PUBLISHING.md).

## 🤝 Участие в проекте

Участие приветствуется в любой форме: issues, pull request'ы, отзывы и идеи. Подробности — в [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Лицензия

[MIT](LICENSE)
