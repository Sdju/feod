---
title: layer-imports
---

# feod-structure/layer-imports

Направления зависимостей и публичные API модулей.

Включено как `error` в `recommended` и `strict`. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Не даёт слоям зависеть от запрещённых слоёв и закрывает приватную реализацию
модулей. Это основная проверка архитектурных границ: алиас не позволяет обойти
публичный API.

## Что проверяет

Для стандартного набора разрешены следующие направления:

| Источник | Допустимые цели |
| --- | --- |
| `app` | `app`, `pages`, `modules`, `common` |
| `pages` | `modules`, `common` |
| `modules` | `modules`, `common` |
| `common` | `common` |
| `global` | Все стандартные слои |

Остальные слои не могут импортировать `global`. Слой `app` может импортировать
собственные файлы; страницы по умолчанию изолированы друг от друга. Для
пользовательских наборов направления определяются `layers.*.imports`.

Внешний потребитель модуля должен использовать публичный entry (`index.*`
по умолчанию) или импорт каталога. Внутри собственного модуля допустимы импорты
реализации. По умолчанию родитель обращается к ребёнку через API, ребёнок может
читать реализацию непосредственного родителя. Между корнями нужны
`dependencies` и публичный API верхнего модуля целевого корня.

## Примеры

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'common не может зависеть от modules.', marker: 'warn' },
  { line: 5, content: 'Внешняя страница обращается к приватной реализации User.', marker: 'warn' },
]">

```ts
// src/common/format.ts
import { user } from '@modules/User'; // common не зависит от modules // [!code error]

// src/pages/profile.ts
import { model } from '@modules/User/model'; // приватный файл // [!code error]
```

</AnnotatedCode>

### Корректно

<AnnotatedCode :annotations="[
  { line: 2, content: 'Публичный API User доступен странице.', marker: 'check' },
  { line: 6, content: 'Внутри User разрешён прямой доступ к собственной реализации.', marker: 'check' },
]">

```ts
// src/pages/profile.ts
import { user } from '@modules/User'; // [!code highlight]
import { format } from '@common/format';

// src/modules/User/view.ts
import { model } from './model'; // собственная реализация // [!code highlight]
```

</AnnotatedCode>

## Посмотрите границу в файлах

Откройте `profile.ts`, затем `User/index.ts` и `User/model.ts` в дереве.
На строках импорта отмечены ошибка и допустимый путь. Наведите на маркер
или нажмите его, чтобы прочитать пояснение.

<div class="lint-example">

<!-- @include code-view: ../_examples/public-api -->

</div>

Наличие публичного экспорта в index не разрешает прямой импорт `model.ts`.
Потребитель использует API, а сам модуль свободно меняет внутреннюю структуру.

### Исправление импорта

```ts
// src/pages/profile.ts
import { userState } from '@modules/User/model'; // [!code --]
import { userState } from '@modules/User'; // [!code ++]
```

Путь меняется на публичный API; внутренний файл модуля остаётся на своём месте.

## Настройка

```js
createConfig({
  singleFileModules: true,
  transitModules: ['package-manager'],
  modulePages: true,
  modules: { publicEntries: ['index.ts'] },
  submodules: {
    visibility: 'parent-only',
    parentImports: 'public',
    childImportsParent: 'implementation',
  },
  imports: { computed: 'forbid', unresolved: 'forbid' },
  globals: { localImports: 'type-only' },
});
```

| Поле проекта | По умолчанию | Поведение |
| --- | --- | --- |
| `layers` | `frontendLayers` | Слои и разрешённые направления |
| `dependencies` у корня | `[]` | Разрешённые целевые корни |
| `modules.publicEntries` | `[]` | Пустой список сохраняет `index.*`, непустой задаёт точные имена |
| `singleFileModules` | `false` | Модули вида `modules/logger.ts` |
| `transitModules` | `[]` | Прямые подмодули transit-контейнера; `_` — приватное ядро |
| `modulePages` | `false` | Страницы `modules/Name/pages`, доступные из `Name/index.*` |
| `submodules.visibility` | `"public"` | `parent-only` закрывает API ребёнка от посторонних |
| `submodules.parentImports` | `"public"` | `implementation` разрешает родителю внутренние файлы ребёнка |
| `submodules.childImportsParent` | `"implementation"` | `public` требует API непосредственного родителя |
| `imports.computed` | `"ignore"` | `forbid` запрещает неизвестные выражения в import/require |
| `imports.unresolved` | `"ignore"` | `forbid` сообщает локальные пути без существующего файла |
| `globals.localImports` | `"allow"` | `type-only` или `forbid` для исходящих локальных импортов globals |

Прямые options принимают группы **пути**, **алиасы**, `layerDirs`, `layers`,
`dependencies`, `submodules`, `imports`, `globals`, `transitModules`,
`singleFileModules`, `modulePages` и **`publicEntries`**. Поле `modules`
в options правила не передаётся.

## Ограничения и связанные правила

Поддерживаемые формы зависимостей перечислены во [введении](../).
Type-only импорты также соблюдают границы. `globals.localImports: 'type-only'`
не отменяет остальные ограничения для разрешённых типов.

Существование публичного entry проверяет [module-entries](./module-entries).
Циклы проверяют [no-module-cycles](./no-module-cycles) и
[no-file-cycles](./no-file-cycles). Дополнительные ограничения вложенных
модулей задаёт [no-submodule-of-submodule](./no-submodule-of-submodule).
Пути, не отнесённые к слоям, и исключения `ignore` могут оставлять границы
непроверенными; используйте [no-unknown-files](./no-unknown-files).

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/layer-imports.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/layer-sets.spec.ts) ·
[Все правила](./)
