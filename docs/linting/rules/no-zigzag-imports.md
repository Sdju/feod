---
title: no-zigzag-imports
---

# feod-structure/no-zigzag-imports

Относительные импорты внутренних файлов другого модуля.

Включено как `error` в `recommended` и `strict`. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Запрещает относительный путь, который выходит из одного верхнего модуля
и заходит во внутренний файл другого. Относительный импорт публичного API
разрешён: обязательного требования использовать алиас нет.

## Примеры

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'Относительный путь выходит из Cart и входит в приватный файл User.', marker: 'warn' },
]">

```ts
// src/modules/Cart/view.ts
import { model } from '../User/model'; // [!code error]
```

</AnnotatedCode>

### Корректно

<AnnotatedCode :annotations="[
  { line: 2, content: 'Относительный импорт публичного API разрешён.', marker: 'check' },
  { line: 4, content: 'Собственные файлы модуля остаются доступны.', marker: 'check' },
]">

```ts
// src/modules/Cart/view.ts
import { user } from '../User'; // [!code highlight]
import { user as userFromIndex } from '../User/index';
import { state } from './state'; // [!code highlight]
```

</AnnotatedCode>

### Исправление импорта

```ts
// src/modules/Cart/view.ts
import { userState } from '../User/model'; // [!code --]
import { userState } from '../User'; // [!code ++]
```

Не обязательно переходить на алиас: достаточно использовать публичный вход.

## Настройка

```js
createConfig({ modules: { publicEntries: ['index.ts', 'public.ts'] } });
```

| Поле проекта | Прямая опция | По умолчанию |
| --- | --- | --- |
| `modules.publicEntries` | `publicEntries` | `[]` — публичны `index.*` |
| `transitModules` | `transitModules` | `[]` |

Прямые options также принимают группы **пути**, **алиасы**,
`layerDirs: { modules: '…' }`.

## Границы проверки

Правило срабатывает для относительных импортов между разными верхними модулями.
Алиасы, доступ parent/child и внутренние границы вложенных модулей проверяет
[layer-imports](./layer-imports). Для глубокого адресата определяется публичный
entry его непосредственного владельца, но
[no-submodule-of-submodule](./no-submodule-of-submodule) может запрещать даже
публичный доступ к нему.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/no-zigzag-imports.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/no-zigzag-imports.spec.ts) ·
[Все правила](./)
