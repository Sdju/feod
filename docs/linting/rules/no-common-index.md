---
title: no-common-index
---

# feod-structure/no-common-index

Запрет index-файлов и их импорта в common.

Включено как `error` в `recommended` и `strict`. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Сохраняет явные импорты небольших общих утилит. `common` не становится модулем
с общей barrel-точкой входа, которая скрывает реальные зависимости.

## Что проверяет

Сообщает о посещённом `index.*` внутри слоя с ролью `common` и об импорте такого
файла из другого файла. Проверяет путь, а не содержимое: даже `index.ts` без
реэкспортов запрещён. Импорт каталога, разрешившийся в его index, тоже проверяется.

## Примеры

<FileTree>
  <FileTreeNode name="common" type="folder">
    <FileTreeNode name="format.ts" type="file" comment="Импортируйте утилиту напрямую" />
    <FileTreeNode name="index.ts" type="file" comment="Запрещён независимо от содержимого" forbidden />
    <FileTreeNode name="ui" type="folder">
      <FileTreeNode name="Button.vue" type="file" />
      <FileTreeNode name="index.ts" type="file" comment="Запрет распространяется и на вложенные группы" forbidden />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Зачёркнутые `index.ts` запрещены. Корректные импорты ведут непосредственно к файлу.

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'index.ts в common запрещён даже без сложной логики.', marker: 'warn' },
  { line: 5, content: 'Импорт запрещённого index тоже диагностируется.', marker: 'warn' },
]">

```ts
// src/common/index.ts
export { format } from './format'; // [!code error]

// src/modules/User/view.ts
import { format } from '@common/index'; // [!code error]
```

</AnnotatedCode>

### Корректно

<AnnotatedCode :annotations="[
  { line: 5, content: 'Зависимость явно указывает файл утилиты.', marker: 'check' },
]">

```ts
// src/common/format.ts
export const format = (value: string) => value.trim();

// src/modules/User/view.ts
import { format } from '@common/format'; // [!code highlight]
```

</AnnotatedCode>

## Настройка

```js
createConfig({ layerDirs: { common: 'shared' } });
```

Специального переключателя `allowIndex` нет. Для другого архитектурного
соглашения отключите правило или используйте слой без роли `common`.
Прямые options: группы **пути**, **алиасы**, `layerDirs: { common: '…' }`.

## Когда ослаблять

При миграции старого `shared` с barrel-файлами можно временно отключить правило
для этой части. Учитывайте [разницу между files и ignore](../migration).
Наличие запрещённого файла без посещения линтером эта проверка сама не сканирует.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/no-common-index.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/no-common-index.spec.ts) ·
[Все правила](./)
