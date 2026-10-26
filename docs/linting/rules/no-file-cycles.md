---
title: no-file-cycles
---

# feod-structure/no-file-cycles

Циклы зависимостей между файлами.

Выключено в `recommended` и `strict`. Включается настройками проекта. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Находит циклические зависимости между исходными файлами всех известных слоёв,
в том числе внутри одного модуля.

## Примеры

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'a.ts зависит от b.ts.', marker: 'warn' },
  { line: 6, content: 'b.ts возвращается к a.ts: файловый цикл замкнулся.', marker: 'warn' },
]">

```ts
// src/modules/User/a.ts
import { b } from './b'; // [!code error]
export const a = () => b();

// src/modules/User/b.ts
import { a } from './a'; // [!code error]
export const b = () => a();
```

</AnnotatedCode>

### Корректно

<AnnotatedCode :annotations="[
  { line: 2, content: 'a.ts зависит от b.ts, но обратного импорта больше нет.', marker: 'check' },
]">

```ts
// src/modules/User/a.ts
import { b } from './b'; // [!code highlight]
export const a = () => b();

// src/modules/User/b.ts
export const b = () => 'user';
```

</AnnotatedCode>

### Разрыв файлового цикла

```ts
// src/modules/User/b.ts
import { a } from './a'; // [!code --]
export const b = () => a(); // [!code --]
export const b = () => 'user'; // [!code ++]
```

Уберите обратную зависимость либо вынесите общую часть в третий файл, который не импортирует потребителей.

## Настройка

```js
createConfig({ cycles: { files: true } });
```

| Поле проекта | Прямая опция | По умолчанию |
| --- | --- | --- |
| `cycles.files` | `enabled` | `false` в проектном конфиге |
| `singleFileModules` | `singleFileModules` | `false` |
| `transitModules` | `transitModules` | `[]` |

При ручном включении правила `enabled` по умолчанию не отключает анализ.
Прямые options также принимают группы **пути**, **алиасы**, `layers`, `layerDirs`.

## Ограничения и отличие от модульного графа

Учитываются value-зависимости; явные type-only рёбра пропускаются.
`cycles.types: 'include'` относится только к [no-module-cycles](./no-module-cycles)
и не меняет файловый граф.

Граф строится по исходникам на диске с offline-резолвером в пределах выбранного
корня. Рёбра, которые невозможно статически извлечь или разрешить, могут быть
пропущены. При необходимости отдельно запрещайте computed/unresolved импорты
в [layer-imports](./layer-imports). Циклическая компонента сообщается один раз
за прогон и может быть привязана к посещённому файлу, который запустил анализ.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/no-file-cycles.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/graph.spec.ts) ·
[Все правила](./)
