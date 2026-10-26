---
title: Настройка Oxlint
---

# Настройка Oxlint

`@o-feod/oxlint-structure-plugin` регистрирует в Oxlint общие правила o-feod.
Имена `feod-structure/*`, параметры и архитектурное поведение совпадают с ESLint.

## Установка

```sh
pnpm add -D oxlint @o-feod/oxlint-structure-plugin
```

По требованиям пакета нужны Oxlint 1.86 или новее в пределах v1 и Node.js
20.19+ или 22.12+. JavaScript API плагинов Oxlint имеет статус alpha.
Сверяйте совместимость с README устанавливаемой версии.

## Быстрый старт

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';
import { recommended } from '@o-feod/oxlint-structure-plugin/configs';

export default defineConfig(recommended);
```

```sh
pnpm exec oxlint src
```

Запускайте из корня проекта: он используется как `rootDir` по умолчанию.
Пресет регистрирует FEOD через `jsPlugins`; стандартные проверки Oxlint
продолжают работать. Для `strict` замените импорт пресета. Без `levels`
дополнительное правило `visibility-levels` не ограничивает глубину.

## Общая конфигурация проекта

`configFromProject` читает `feod.config.json` или секцию `feod` в `package.json`:

<AnnotatedCode :annotations="[
  { line: 4, content: 'В Oxlint построитель импортируется из /configs, а не из корня пакета.', marker: 'info' },
  { line: 6, content: 'Возвращаемый объект уже содержит jsPlugins с регистрацией FEOD.', marker: 'info' },
  { line: 7, content: 'Укажите каталог нужного workspace-пакета; от него считаются roots и пути.', marker: 'info' },
  { line: 8, content: 'Ограничения и политики общие с ESLint, но уровни глубины нужно задать отдельно.', marker: 'info' },
]">

```ts
// oxlint.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'oxlint';
import { configFromProject } from '@o-feod/oxlint-structure-plugin/configs';

export default defineConfig(configFromProject({
  rootDir: fileURLToPath(new URL('.', import.meta.url)),
  preset: 'strict',
}));
```

</AnnotatedCode>

```json
{
  "$schema": "https://feod.dev/feod.schema.json",
  "rootDefault": {
    "modules": { "requirePublicEntry": true },
    "cycles": { "modules": true }
  },
  "roots": { "src": {} }
}
```

Для объекта в коде используйте `createConfig` из `/configs`:

```ts
import { defineConfig } from 'oxlint';
import { createConfig } from '@o-feod/oxlint-structure-plugin/configs';
import { cliLayers } from '@o-feod/oxlint-structure-plugin/presets';

export default defineConfig(createConfig({ layers: cliLayers }));
```

Эти функции доступны с `0.1.5`; в `0.1.0` их нет. Статические пресеты не читают JSON
автоматически. Все политики общие с ESLint; см. [конфигурацию](./configuration).

## Изменение severity

Сохраняйте options, которые создал построитель конфигурации:

```ts
import { defineConfig } from 'oxlint';
import { configFromProject } from '@o-feod/oxlint-structure-plugin/configs';

const config = configFromProject();
const [, options] = config.rules['feod-structure/layer-imports'];
config.rules['feod-structure/layer-imports'] = ['warn', options];
export default defineConfig(config);
```

При использовании нескольких JS-плагинов объединяйте `jsPlugins` с
`...recommended.jsPlugins` или `...config.jsPlugins`. Замена массива целиком
удалит регистрацию FEOD.

## Ручное подключение через JSON

```json
{
  "jsPlugins": [{
    "name": "feod-structure",
    "specifier": "@o-feod/oxlint-structure-plugin"
  }],
  "rules": {
    "feod-structure/layer-imports": ["error", {
      "srcRoot": "src",
      "layerAliases": { "#features": "src/modules" }
    }]
  }
}
```

Сохраните как `.oxlintrc.json`. Этот пример включает одно правило; состав
пресетов приведён в [каталоге](./rules/). Поля `rootDefault` и `roots`
относятся к отдельной конфигурации FEOD и не добавляются на верхний уровень `.oxlintrc.json`.

## TypeScript, Vue и резолвер

Oxlint использует свой парсер. FEOD проверяет импорты внутри Vue `<script>`
и `<script setup lang="ts">`, но не шаблоны. Пользовательские ESLint-парсеры
и processors в Oxlint не переносятся.

Встроенная поддержка `tsconfig` в Oxlint не настраивает JavaScript-резолвер
FEOD автоматически. Задавайте `layerAliases`, `aliasPrefix`, `aliasRoot`
в конфигурации FEOD или совместимый `settings['import/resolver']`.

При пропущенной зависимости сначала проверьте, удалось ли FEOD разрешить путь.
Политика `imports.unresolved: "forbid"` включает диагностику неразрешённых
локальных импортов в `layer-imports`; вычисляемые пути регулируются отдельно
через `imports.computed`.
