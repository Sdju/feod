---
title: no-module-cycles
---

# feod-structure/no-module-cycles

Циклы зависимостей между модулями.

Выключено в `recommended` и `strict`. Включается настройками проекта. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Находит взаимную зависимость владельцев модулей. Даже если конкретные файлы
не образуют цикл, архитектура `User → Cart → User` связывает модули в одно целое.

## Примеры

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'User зависит от Cart.', marker: 'warn' },
  { line: 5, content: 'Cart зависит от User: владельцы образуют цикл.', marker: 'warn' },
]">

```ts
// src/modules/User/cart.ts
import { cart } from '@modules/Cart'; // [!code error]

// src/modules/Cart/user.ts
import { user } from '@modules/User'; // [!code error]
```

</AnnotatedCode>

Рёбра агрегируются по владельцам: не требуется, чтобы именно эти два файла
импортировали друг друга напрямую.

### Корректно

<AnnotatedCode :annotations="[
  { line: 2, content: 'Зависимость осталась только в одном направлении.', marker: 'check' },
]">

```ts
// src/modules/Cart/user.ts
import { user } from '@modules/User'; // [!code highlight]

// src/modules/User/model.ts
// User не импортирует Cart; сборка сценария остаётся выше по архитектуре.
export const user = { id: '1' };
```

</AnnotatedCode>

## Настройка

```js
createConfig({ cycles: { modules: true, types: 'include' } });
```

| Поле проекта | Прямая опция | По умолчанию |
| --- | --- | --- |
| `cycles.modules` | `enabled` | `false` в проектном конфиге |
| `cycles.types` | `typeEdges` | `"ignore"` |
| `singleFileModules` | `singleFileModules` | `false` |
| `transitModules` | `transitModules` | `[]` |

Обычные value-зависимости учитываются всегда. `types: 'include'` добавляет
явные type-only зависимости, кроме импорта модулем собственного предка.
При ручном включении правила `enabled` по умолчанию не отключает анализ.
Прямые options также принимают группы **пути**, **алиасы**, `layers`, `layerDirs`.

## Ограничения

Граф строится по filesystem inventory и статически извлекаемым зависимостям
с offline-резолвером; произвольные вычисляемые пути и пользовательская
runtime-логика не анализируются. Настройки стороннего ESLint resolver не
заменяют настройки offline-анализа: задавайте FEOD aliases явно.
Анализ выполняется в пределах выбранного корня, а не единого графа всех roots.
Одна циклическая компонента сообщается один раз за прогон.

Цикл внутри одного владельца модульный граф не видит. Для этого используйте
[no-file-cycles](./no-file-cycles). Разрешённая политика parent/child в
[layer-imports](./layer-imports) сама по себе не разрешает циклические зависимости.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/no-module-cycles.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/graph.spec.ts) ·
[Все правила](./)
