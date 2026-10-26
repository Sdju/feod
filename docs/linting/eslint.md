---
title: Настройка ESLint
---

# Настройка ESLint

`@o-feod/eslint-structure-plugin` подключает проверки FEOD к ESLint Flat config.
Общий [каталог правил](./rules/) также применим к Oxlint.

## Установка

```sh
pnpm add -D eslint @o-feod/eslint-structure-plugin
```

Примеры с `createConfig` и `configFromProject` требуют версии `0.1.5` или новее.
Для `0.1.0` используйте статический пресет и опции правил из следующего примера.

## Быстрый старт

```js
// eslint.config.mjs
import feod from '@o-feod/eslint-structure-plugin';

export default [{
  ...feod.configs.recommended,
  plugins: { 'feod-structure': feod },
  files: ['src/**/*.{js,mjs,cjs}'],
}];
```

```sh
pnpm exec eslint src
```

Запускайте команду из корня проекта. Статический пресет не читает конфигурацию
FEOD с диска. `strict` подключается аналогично через `feod.configs.strict`.
Его отличие — `visibility-levels`; ограничения начнут действовать после задания `levels`.

## Общая конфигурация проекта

Создайте `feod.config.json` или секцию `feod` в `package.json` — один из источников:

```json
{
  "$schema": "https://feod.dev/feod.schema.json",
  "rootDefault": {
    "layerDirs": { "global": "globals" },
    "modules": { "requirePublicEntry": true }
  },
  "roots": { "src": {} }
}
```

<AnnotatedCode :annotations="[
  { line: 6, content: 'Настройки читаются только при явном вызове configFromProject; статический пресет JSON не загружает.', marker: 'info' },
  { line: 7, content: 'Явный rootDir привязывает конфигурацию к каталогу этого файла, независимо от текущей рабочей директории.', marker: 'info' },
  { line: 8, content: 'strict добавляет visibility-levels; для реального ограничения глубины нужен levels.', marker: 'info' },
  { line: 10, content: 'files определяет, какие файлы получат этот ESLint-конфиг. Для нескольких корней расширьте маски.', marker: 'info' },
]">

```js
// eslint.config.mjs
import { fileURLToPath } from 'node:url';
import { configFromProject } from '@o-feod/eslint-structure-plugin';

export default [{
  ...configFromProject({
    rootDir: fileURLToPath(new URL('.', import.meta.url)),
    preset: 'strict',
  }),
  files: ['src/**/*.{js,mjs,cjs}'],
}];
```

</AnnotatedCode>

`configFromProject` регистрирует плагин, загружает настройки и строит правила
для всех корней. Для workspace указывайте `rootDir` пакета явно. Если корней
несколько, добавьте их в `files`. Исходник вне всех FEOD-корней не проверяется
архитектурными правилами.

Для настроек прямо в JS используйте `createConfig(config, options)` вместо
`configFromProject`. Эта функция проверяет объект и не читает файлы:

```js
import { createConfig } from '@o-feod/eslint-structure-plugin';

export default [createConfig({
  common: { maxDepth: 2 },
  singleFileModules: true,
})];
```

Все поля, правила наследования и несколько корней описаны в
[конфигурации](./configuration).

## TypeScript

FEOD не поставляет парсер. Добавьте парсер TypeScript к тому же набору файлов:

```sh
pnpm add -D @typescript-eslint/parser
```

```js
// eslint.config.mjs
import tsParser from '@typescript-eslint/parser';
import { configFromProject } from '@o-feod/eslint-structure-plugin';

export default [{
  ...configFromProject(),
  files: ['src/**/*.{ts,tsx,mts,cts}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
}];
```

Для проверок деклараций включите также нужные `.d.ts`, `.d.mts`, `.d.cts`:
они попадают в приведённые маски. Само расширение `.d.ts` не превращает обычный
импорт в `import type`.

## Vue SFC

Для `.vue` внешним парсером должен быть `vue-eslint-parser`, а парсер TypeScript
передаётся в его `parserOptions.parser`:

```sh
pnpm add -D vue-eslint-parser @typescript-eslint/parser
```

```js
// eslint.config.mjs
import vueParser from 'vue-eslint-parser';
import tsParser from '@typescript-eslint/parser';
import { configFromProject } from '@o-feod/eslint-structure-plugin';

export default [{
  ...configFromProject(),
  files: ['src/**/*.vue'],
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
}];
```

Это конфигурация для Vue-файлов; для отдельных `.ts` добавьте блок из предыдущего
примера. FEOD проверяет зависимости в `<script>` и `<script setup>`. Проверки
шаблонов подключайте через `eslint-plugin-vue`.

## Алиасы и резолвер

Встроенный резолвер понимает `@/…`, алиасы слоёв и относительные пути. Для иных
алиасов задайте `layerAliases` в конфигурации FEOD:

```json
{ "rootDefault": { "layerAliases": { "#features": "src/modules" } } }
```

Также поддерживается `settings['import/resolver']`, например с установленным
`eslint-import-resolver-typescript`:

```js
settings: {
  'import/resolver': { typescript: { project: './tsconfig.json' } },
}
```

Этот фрагмент добавляется в ESLint config рядом с `rules` и `languageOptions`.
Совпадение алиасов сборщика, TypeScript и линтера настраивается проектом.

## Severity и отключение правил

Сохраняйте сгенерированные options при замене `error` на `warn`:

```js
import { configFromProject } from '@o-feod/eslint-structure-plugin';

const config = configFromProject();
const [, options] = config.rules['feod-structure/layer-imports'];
config.rules['feod-structure/layer-imports'] = ['warn', options];
config.rules['feod-structure/no-common-deep'] = 'off';
export default [config];
```

Замена всей записи на `'warn'` теряет пути, политики и настройки корней.
Отключение можно ограничить отдельным `files`-блоком Flat config; особенности
проверок, которые сканируют файловую систему, разобраны в [миграции](./migration).

## Подключение одного правила

Для ручного подключения регистрируйте плагин и передавайте только options,
поддерживаемые выбранным правилом:

```js
import feod from '@o-feod/eslint-structure-plugin';

export default [{
  plugins: { 'feod-structure': feod },
  files: ['src/**/*.{js,mjs,cjs}'],
  rules: {
    'feod-structure/layer-imports': ['error', {
      srcRoot: 'src',
      layerAliases: { '#features': 'src/modules' },
    }],
  },
}];
```

Точные параметры приведены на [страницах правил](./rules/). Проектная запись
`modules.publicEntries` и прямая опция правила `publicEntries` — разные уровни
конфигурации; не переносите весь объект FEOD внутрь options одного правила.
