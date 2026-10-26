---
title: no-common-deep
---

# feod-structure/no-common-deep

Ограничение глубины каталогов common.

Включено как `error` в `recommended` и `strict`. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Ограничивает рост общего слоя в иерархию скрытых модулей. Проверяет расположение
самого файла, а не глубину импортируемого пути.

## Что проверяет

Считает каталоги между корнем `common` и файлом. Файл непосредственно в `common`
имеет глубину `0`, `common/utils/format.ts` — `1`,
`common/utils/date/format.ts` — `2`.

## Примеры

При стандартном `maxDepth: 1` считайте каталоги **после `common`**.
Имя файла не увеличивает глубину.

<FileTree>
  <FileTreeNode name="common" type="folder" bold>
    <FileTreeNode name="format.ts" type="file" comment="Глубина 0: файл непосредственно в common" />
    <FileTreeNode name="date" type="folder">
      <FileTreeNode name="format.ts" type="file" comment="Глубина 1: допустимо" />
    </FileTreeNode>
    <FileTreeNode name="utils" type="folder">
      <FileTreeNode name="date" type="folder">
        <FileTreeNode name="format.ts" type="file" comment="Глубина 2: превышает maxDepth = 1" forbidden />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Зачёркнутый файл нарушает правило. Если `date` — самостоятельная общая группа,
уберите лишний уровень `utils` и оставьте `common/date/format.ts`.

## Настройка

```js
createConfig({ common: { maxDepth: 2 } });
```

| Поле проекта | Прямая опция | По умолчанию |
| --- | --- | --- |
| `common.maxDepth` | `maxDepth` | `1` |

Значение — целое неотрицательное число. При `0` допустимы только файлы
непосредственно в `common`. Прямые options также принимают группу **пути**
и `layerDirs: { common: '…' }`; алиасы здесь не нужны.

## Когда ослаблять

Если общие UI-компоненты требуют дополнительных каталогов, увеличьте лимит
для соответствующего корня. Это не отменяет [no-common-index](./no-common-index)
и запрет бизнес-зависимостей из `common` в [layer-imports](./layer-imports).

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/no-common-deep.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/no-common-deep.spec.ts) ·
[Все правила](./)
