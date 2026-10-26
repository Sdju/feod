---
title: global-files
---

# feod-structure/global-files

Допустимые пути файлов глобального слоя.

Выключено в `recommended` и `strict`. Включается настройками проекта. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Ограничивает состав глобального слоя, например разрешает только TypeScript
declarations и не даёт складывать туда исполняемые утилиты.

## Примеры

При `globals.allowedFiles: ['**/*.d.ts']` правило разрешает declarations
и запрещает остальные посещённые файлы глобального слоя.

<FileTree>
  <FileTreeNode name="global" type="folder" bold>
    <FileTreeNode name="env.d.ts" type="file" comment="Разрешён: совпадает с **/*.d.ts" />
    <FileTreeNode name="types" type="folder">
      <FileTreeNode name="window.d.ts" type="file" comment="Вложенные declarations тоже разрешены" />
    </FileTreeNode>
    <FileTreeNode name="helpers.ts" type="file" comment="Не совпадает с разрешённой маской" forbidden />
    <FileTreeNode name="bootstrap.js" type="file" comment="Исполняемый код не входит в выбранную политику" forbidden />
  </FileTreeNode>
</FileTree>

Здесь ограничение задано конфигурацией проекта. Само имя `global` не устанавливает
список разрешённых расширений.

## Настройка

```js
createConfig({
  globals: { allowedFiles: ['**/*.d.ts', '**/*.d.mts', '**/*.d.cts'] },
});
```

| Поле проекта | Прямая опция | По умолчанию |
| --- | --- | --- |
| `globals.allowedFiles` | `allowedFiles` | `[]` — проверка отключена |

Маски считаются **от каталога слоя с ролью `global`**, а не от корня проекта.
Учитываются вложенные и скрытые файлы. Пустой список в конкретном корне
выключает унаследованную проверку.

Прямые options также принимают группу **пути**, `layers`,
`layerDirs: { global: '…' }`.

## Ограничения

Проверяется имя и путь посещённого файла, а не то, содержит ли он допустимые
declarations. ESLint должен включать нужные расширения в `files` и иметь парсер.
Вложенный пользовательский слой определяется по наиболее длинному пути и
не наследует роль global только из-за расположения.

Исходящие импорты регулирует `globals.localImports` в
[layer-imports](./layer-imports). `allowedFiles: []` эту политику не сбрасывает.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/global-files.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/structure.spec.ts) ·
[Все правила](./)
