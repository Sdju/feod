---
title: confine
---

# feod-structure/confine

Ограничение импортов и строк выбранными файлами.

Выключено в `recommended` и `strict`. Включается настройками проекта. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Закрепляет отдельные зависимости или платформенные строки за адаптерами:
например, только OS-модуль может импортировать `node:fs` или работать с `/proc`.
Политики задаёт проект, встроенного списка запрещённых библиотек нет.

## Примеры

При разрешении `node:**` только внутри `src/modules/Os/**`:

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'node:fs/promises разрешён только внутри src/modules/Os.', marker: 'warn' },
]">

```ts
// src/modules/User/model.ts
import { readFile } from 'node:fs/promises'; // [!code error]
```

</AnnotatedCode>

### Корректно

<AnnotatedCode :annotations="[
  { line: 2, content: 'Этот файл находится в разрешённом OS-адаптере.', marker: 'check' },
]">

```ts
// src/modules/Os/files.ts
import { readFile } from 'node:fs/promises'; // [!code highlight]
```

</AnnotatedCode>

## Настройка

```js
createConfig({
  extra: {
    confine: [
      {
        name: 'node-only',
        imports: ['node:**'],
        allowedIn: ['src/modules/Os/**'],
        allowTypeImports: true,
      },
      {
        name: 'os-implementation',
        targets: ['src/modules/Os/**'],
        allowedIn: ['src/app/**', 'src/modules/Os/**'],
      },
      {
        name: 'linux-paths',
        literals: ['^/proc(/|$)'],
        allowedIn: ['src/modules/Os/**'],
        message: 'Доступ к /proc должен оставаться в OS-адаптере',
      },
    ],
  },
});
```

| Поле записи | Назначение |
| --- | --- |
| `name` | Уникальное имя ограничения |
| `imports` | Picomatch-маски по спецификатору как он написан; `node:**` покрывает `node:fs/promises` |
| `targets` | Маски по разрешённому пути цели от корня проекта; покрывают относительные и alias-импорты |
| `literals` | Исходники регулярных выражений для строк и статических частей шаблонов |
| `allowedIn` | Маски файлов-источников от корня проекта; `[]` означает «нигде» |
| `allowTypeImports` | При `true` освобождает явные type-only импорты от этой записи |
| `message` | Собственный текст диагностики |

Список в корне заменяет унаследованный целиком; `[]` отключает проверку.
Прямые options: `confine` вместо `extra.confine`, группы **пути**, **алиасы**.

## Ограничения

`targets` требует успешного разрешения пути offline-резолвером. Неизвестная цель
пропускается. Источники импортов проверяются как импорты, а не повторно как
строковые литералы. Правило не вычисляет строки, собранные во время выполнения;
у шаблонов анализируются статические части.

Разрешение в `allowedIn` не открывает приватные файлы модуля: параллельно
действует [layer-imports](./layer-imports). Для запрета вычисляемых путей задайте
`imports.computed: 'forbid'` отдельно.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/confine.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/confine.spec.ts) ·
[Все правила](./)
