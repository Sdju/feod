---
title: module-names
---

# feod-structure/module-names

Запрещённые имена владельцев модулей.

Выключено в `recommended` и `strict`. Включается настройками проекта. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Позволяет договориться о предметных именах модулей и запретить названия,
которые в конкретном проекте превращаются в общие свалки.
Встроенного списка запрещённых имён нет.

## Примеры

При `modules.forbiddenNames: ['shared', 'utils']` важно отличать
**владельца модуля** от обычного каталога реализации.

<FileTree>
  <FileTreeNode name="modules" type="folder">
    <FileTreeNode name="shared" type="folder" comment="Запрещённое имя верхнего модуля" forbidden>
      <FileTreeNode name="index.ts" type="file" />
    </FileTreeNode>
    <FileTreeNode name="User" type="folder" bold>
      <FileTreeNode name="index.ts" type="file" />
      <FileTreeNode name="utils" type="folder" comment="Допустимо: каталог реализации внутри User">
        <FileTreeNode name="format.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="modules" type="folder">
        <FileTreeNode name="utils" type="folder" comment="Запрещено: это уже отдельный владелец модуля" forbidden>
          <FileTreeNode name="index.ts" type="file" />
        </FileTreeNode>
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

`User/utils` разрешён, а `User/modules/utils` запрещён: сегмент `modules`
обозначает границу нового владельца. Пояснения доступны у значков в дереве.

## Настройка

```js
createConfig({ modules: { forbiddenNames: ['shared', 'utils'] } });
```

| Поле проекта | Прямая опция | По умолчанию |
| --- | --- | --- |
| `modules.forbiddenNames` | `forbiddenNames` | `[]` — проверка отключена |
| `singleFileModules` | `singleFileModules` | `false` |
| `transitModules` | `transitModules` | `[]` |

Сравнение точное и чувствительно к регистру. Проверяются текущий владелец
и его предки: верхние и вложенные модули, transit-контейнер и прямые дети.
Для однофайлового модуля имя берётся без последнего расширения.
Пустой список в корне сбрасывает унаследованный запрет.

Прямые options также принимают группу **пути**, `layers`,
`layerDirs: { modules: '…' }`.

## Ограничения

Inventory находит и пустые каталоги модулей, и владельцев только с assets;
диагностики дедуплицируются за прогон. Отключение правила через `files`
у одного исходника не исключает его владельца из filesystem inventory.
Чтобы исключить область, используйте настройки корней или FEOD `ignore`.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/module-names.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/structure.spec.ts) ·
[Все правила](./)
