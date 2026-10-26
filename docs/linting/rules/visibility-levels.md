---
title: visibility-levels
---

# feod-structure/visibility-levels

Глубина внешних импортов для выбранных каталогов.

Включено как `error` только в `strict`; в `recommended` выключено. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Позволяет ограничить внешние обращения в выбранные каталоги, например открыть
файлы непосредственно в `router`, сохранив его глубокую реализацию локальной.
Без списка `levels` правило ничего не ограничивает.

## Примеры

При `levels: [{ name: 'router', visibility: 'default', maxDepth: 1 }]`:

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'После router два сегмента: guards и auth.ts; лимит равен одному.', marker: 'warn' },
]">

```ts
// src/app/main.ts
import { guard } from './router/guards/auth'; // два сегмента после router // [!code error]
```

</AnnotatedCode>

### Корректно

<AnnotatedCode :annotations="[
  { line: 2, content: 'После router один сегмент: routes.ts.', marker: 'check' },
  { line: 5, content: 'Импорт выполняется изнутри того же router: внешний лимит не действует.', marker: 'check' },
]">

```ts
// src/app/main.ts
import { routes } from './router/routes'; // один сегмент // [!code highlight]

// src/app/router/routes.ts
import { guard } from './guards/auth'; // внутри того же router // [!code highlight]
```

</AnnotatedCode>

## Настройка

```js
createConfig({
  levels: [
    { name: 'router', visibility: 'default', maxDepth: 1 },
    { name: 'components', visibility: 'transparent' },
    { name: 'common', visibility: 'open' },
  ],
}, { preset: 'strict' });
```

| Поле элемента `levels` | Значение | Поведение |
| --- | --- | --- |
| `name` | Имя сегмента пути | Находится первое совпадение в пути цели |
| `visibility` | `default` | Внешняя глубина по умолчанию `1` |
| `visibility` | `transparent` | Имя исключается из подсчёта глубины; собственный лимит по умолчанию `0` |
| `visibility` | `open` | Этот уровень не ограничивается |
| `maxDepth` | Целое число от `0` | Переопределяет лимит default/transparent |

Глубина — число сегментов после уровня, включая имя файла. Имена всех
`transparent`-уровней исключаются из подсчёта. Импорты изнутри того же
каталога уровня не ограничиваются этой проверкой. `open` не отменяет правила
других уровней и модульные границы.

Прямая опция `levels` совпадает с проектной; также доступны группы **пути**,
**алиасы**, `layerDirs`.

## Ограничения

Это проверка сегментов пути, а не произвольная система модульных ролей.
Имя может совпасть с каталогом на разной глубине. Для публичных API модулей
используйте [layer-imports](./layer-imports), для доступа к глубоким модулям —
[no-submodule-of-submodule](./no-submodule-of-submodule).

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/visibility-levels.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/visibility-levels.spec.ts) ·
[Все правила](./)
