---
title: no-submodule-of-submodule
---

# feod-structure/no-submodule-of-submodule

Доступ к глубоким подмодулям только владельцу и непосредственным parent/child.

Включено как `error` в `recommended` и `strict`. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Сохраняет локальность глубокой иерархии: публичный index глубокого подмодуля
не делает его доступным из любого места проекта.

## Что проверяет

Обычные подмодули распознаются по `Parent/modules/Child/modules/Leaf`.
Для цели глубже первого подмодуля (`depth > 1`) импорт разрешён только её
владельцу, непосредственному родителю или непосредственному ребёнку.
Сосед, посторонний модуль и предок через несколько уровней не получают доступ.

## Примеры

<FileTree>
  <FileTreeNode name="Parent" type="folder" bold>
    <FileTreeNode name="index.ts" type="file" comment="Для Leaf — предок через два уровня; прямой импорт Leaf запрещён" />
    <FileTreeNode name="modules" type="folder" fractal>
      <FileTreeNode name="Child" type="folder" bold>
        <FileTreeNode name="index.ts" type="file" comment="Непосредственный родитель Leaf: публичный API Leaf доступен" />
        <FileTreeNode name="modules" type="folder">
          <FileTreeNode name="Leaf" type="folder" bold>
            <FileTreeNode name="index.ts" type="file" />
            <FileTreeNode name="view.ts" type="file" comment="Собственный владелец Leaf: внутренняя реализация доступна" />
          </FileTreeNode>
        </FileTreeNode>
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

`Leaf` находится на глубине 2. Ему не запрещено существовать: правило
ограничивает, кто может обращаться к нему напрямую.

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'Other не является владельцем, родителем или ребёнком Leaf.', marker: 'warn' },
  { line: 5, content: 'Parent пропускает непосредственного владельца Child.', marker: 'warn' },
]">

```ts
// src/modules/Other/index.ts
import { leaf } from '../Parent/modules/Child/modules/Leaf'; // [!code error]

// src/modules/Parent/index.ts
import { leaf } from './modules/Child/modules/Leaf'; // пропущен уровень Child // [!code error]
```

</AnnotatedCode>

### Корректно

<AnnotatedCode :annotations="[
  { line: 2, content: 'Child — непосредственный родитель Leaf.', marker: 'check' },
  { line: 5, content: 'view.ts принадлежит самому Leaf.', marker: 'check' },
]">

```ts
// src/modules/Parent/modules/Child/index.ts
import { leaf } from './modules/Leaf'; // непосредственный родитель // [!code highlight]

// src/modules/Parent/modules/Child/modules/Leaf/view.ts
import { state } from './state'; // собственный владелец // [!code highlight]
```

</AnnotatedCode>

## Настройка

```js
createConfig({ layerDirs: { modules: 'features' } });
```

Отдельного числового лимита у правила нет. Прямые options принимают группы
**пути**, **алиасы**, `layerDirs: { modules: '…' }`.
Вложенный разделитель `modules` остаётся соглашением распознавателя;
переименование верхнего слоя не меняет его.

## Связанные ограничения

Правило входит и в `recommended`, и в `strict`. Оно не запрещает создавать
глубокие подмодули — ограничивает доступ к ним. Политики `parentImports`,
`childImportsParent` и `visibility` задаются в [layer-imports](./layer-imports).
Разрешение непосредственного parent/child здесь не отменяет проверки
публичного API там. Если архитектура намеренно открывает глубокие модули наружу,
это правило можно отключить отдельно.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/no-submodule-of-submodule.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/no-submodule-of-submodule.spec.ts) ·
[Все правила](./)
