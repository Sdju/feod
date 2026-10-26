---
title: no-unknown-files
---

# feod-structure/no-unknown-files

Файлы вне известных слоёв.

Включено как `error` в `recommended` и `strict`. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Не даёт файлам внутри корня исходников выпадать из архитектурных проверок.
Неизвестный каталог сам по себе не становится свободным пользовательским слоем.

## Примеры

При стандартном наборе слоёв `helpers` и `components` не относятся ни к одному
слою. Файлы внутри них нарушают правило.

<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="helpers" type="folder">
      <FileTreeNode name="format.ts" type="file" comment="Нет известного слоя; подходящее место — common/format.ts" forbidden />
    </FileTreeNode>
    <FileTreeNode name="components" type="folder">
      <FileTreeNode name="Button.vue" type="file" comment="Нет известного слоя; общий UI можно разместить в common/ui" forbidden />
    </FileTreeNode>
    <FileTreeNode name="common" type="folder" comment="Известный слой" bold>
      <FileTreeNode name="format.ts" type="file" />
      <FileTreeNode name="ui" type="folder">
        <FileTreeNode name="Button.vue" type="file" />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="modules" type="folder" comment="Известный слой" bold>
      <FileTreeNode name="User" type="folder">
        <FileTreeNode name="view.ts" type="file" />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Зачёркнуты файлы вне слоёв. Для действительно отдельного слоя задайте `layers`
и его разрешённые зависимости, а не переносите файлы только ради прохождения проверки.

## Настройка

```js
createConfig({ inventory: { uncovered: true } });
```

| Поле проекта | Прямая опция | По умолчанию |
| --- | --- | --- |
| `inventory.uncovered` | `filesystem` | `false` |

По умолчанию проверяются только файлы, посещённые линтером. При `true`
строится filesystem inventory и сообщаются также файлы вне слоёв, которые
линтер не посетил, например assets. Диагностики обхода дедуплицируются за прогон.
Для запуска такой проверки линтер должен посетить хотя бы один подходящий файл.

Прямые options также принимают группу **пути**, `layers`, `layerDirs`.

## Когда ослаблять

Сгенерированные файлы внутри корня можно исключить через FEOD `ignore`.
Файлы вне всех явных корней не проверяются. Для legacy лучше описать отдельный
слой без роли — см. [постепенную миграцию](../migration).

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/no-unknown-files.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/no-unknown-files.spec.ts) ·
[Все правила](./)
