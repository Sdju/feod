---
title: module-entries
---

# feod-structure/module-entries

Наличие публичного entry-файла на диске.

Выключено в `recommended` и `strict`. Включается настройками проекта. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Проверка импортов не гарантирует, что у каждого модуля есть публичная точка
входа на диске. Это правило находит владельцев, у которых entry ещё не создан
или был удалён.

## Примеры

При `modules.requirePublicEntry: true` и `modules.publicEntries: ['index.ts']`
модулю недостаточно иметь файлы реализации: нужен entry на диске.

### Ошибка: публичной точки входа нет

<FileTree>
  <FileTreeNode name="modules" type="folder">
    <FileTreeNode name="User" type="folder" comment="Inventory найдёт владельца без index.ts" bold>
      <FileTreeNode name="model.ts" type="file" />
      <FileTreeNode name="view.ts" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

### Корректно: добавлен entry

<FileTree>
  <FileTreeNode name="modules" type="folder">
    <FileTreeNode name="User" type="folder" bold>
      <FileTreeNode name="index.ts" type="file" comment="Новый публичный вход; его наличие проверяется на диске" bold />
      <FileTreeNode name="model.ts" type="file" />
      <FileTreeNode name="view.ts" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Добавление пустого entry удовлетворяет проверке наличия. Какие значения он
экспортирует и можно ли импортировать конкретный путь — отдельные вопросы.

## Настройка

```js
createConfig({
  modules: {
    requirePublicEntry: true,
    publicEntries: ['index.ts', 'public.ts'],
  },
});
```

| Поле проекта | Прямая опция | По умолчанию |
| --- | --- | --- |
| `modules.requirePublicEntry` | `requirePublicEntry` | `false` |
| `modules.publicEntries` | `publicEntries` | `[]` — подходит `index.*` |
| `singleFileModules` | `singleFileModules` | `false` |
| `transitModules` | `transitModules` | `[]` |

Достаточно одного разрешённого entry. Имена в `publicEntries` точные, без путей
и glob-масок. Однофайловые модули освобождены от требования.
У transit-контейнера entry не требуется, у его публичных подмодулей требуется.

Прямые options также принимают группу **пути**, `layers`,
`layerDirs: { modules: '…' }`.

## Ограничения и связанные правила

Inventory проверяет файловую систему, включая пустые и asset-only модули;
сообщения дедуплицируются по владельцу за прогон. Наличие файла не гарантирует,
что он экспортирует нужные значения. Допустимость импорта конкретного entry
проверяют [layer-imports](./layer-imports) и [no-zigzag-imports](./no-zigzag-imports).

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/module-entries.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/inventory.spec.ts) ·
[Все правила](./)
