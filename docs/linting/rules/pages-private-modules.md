---
title: pages-private-modules
---

# feod-structure/pages-private-modules

Область доступа приватных модулей страниц.

Включено как `error` в `recommended` и `strict`. Autofix отсутствует. Поддерживается ESLint и Oxlint.

## Зачем нужно

Не позволяет переиспользовать реализацию одной страницы из другой. Общую логику
нужно вынести в публичный модуль или `common`.

## Что проверяет

Приватная область определяется первым сегментом с префиксом `_` внутри `pages`:

| Расположение | Кто может импортировать |
| --- | --- |
| `pages/_home/**` | Сама область и файлы `pages/home.*` |
| `pages/profile/_profile/**` | Файлы внутри `pages/profile/**` |

Для корневой страницы допускаются и имена вроде `home.test.ts`.

## Примеры

<FileTree>
  <FileTreeNode name="pages" type="folder">
    <FileTreeNode name="home.ts" type="file" comment="Может импортировать _home" />
    <FileTreeNode name="_home" type="folder" comment="Приватная область корневой страницы home" bold>
      <FileTreeNode name="useHome.ts" type="file" />
    </FileTreeNode>
    <FileTreeNode name="settings.ts" type="file" comment="Не может импортировать _home" />
    <FileTreeNode name="profile" type="folder">
      <FileTreeNode name="index.ts" type="file" />
      <FileTreeNode name="_profile" type="folder" comment="Доступно внутри всего pages/profile" bold>
        <FileTreeNode name="header.ts" type="file" />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Значки у файлов поясняют область доступа. Ограничение касается направления
импорта: само существование `_home` или `_profile` допустимо.

### Ошибка

<AnnotatedCode :annotations="[
  { line: 2, content: 'settings не принадлежит приватной области home.', marker: 'warn' },
  { line: 5, content: 'admin находится вне pages/profile.', marker: 'warn' },
]">

```ts
// src/pages/settings.ts
import { useHome } from './_home'; // [!code error]

// src/pages/admin/index.ts
import { header } from '../profile/_profile/header'; // [!code error]
```

</AnnotatedCode>

### Корректно

<AnnotatedCode :annotations="[
  { line: 2, content: 'Корневая страница home использует свою область _home.', marker: 'check' },
  { line: 5, content: 'Файл внутри profile может использовать _profile.', marker: 'check' },
]">

```ts
// src/pages/home.ts
import { useHome } from './_home'; // [!code highlight]

// src/pages/profile/index.ts
import { header } from './_profile/header'; // [!code highlight]
```

</AnnotatedCode>

## Настройка

```js
createConfig({ layerDirs: { pages: 'screens' } });
```

Префикс `_` фиксирован. Прямые options принимают группы **пути**, **алиасы**,
`layerDirs: { pages: '…' }`. Проверка подключается для слоя с ролью `pages`,
включая `commands` в наборе `cliLayers`.

## Связанные правила

Это ограничение приватной области страницы. Направления зависимостей страниц
и публичные входы бизнес-модулей проверяет [layer-imports](./layer-imports).
Для переиспользуемой функциональности перенос в `modules` сохраняет явную границу API.

## Реализация

[Исходный код](https://github.com/Sdju/feod/blob/main/packages/eslint/src/rules/pages-private-modules.ts) ·
[Тесты](https://github.com/Sdju/feod/blob/main/packages/eslint/test/pages-private-modules.spec.ts) ·
[Все правила](./)
