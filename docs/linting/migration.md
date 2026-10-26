---
title: Постепенная миграция
---

# Постепенная миграция

FEOD можно включать частями в одном проекте. Выберите, какую гарантию хотите
получить сейчас: только порядок в новой части или ещё и контроль её границы
со старым кодом. Настройки ниже передаются в `createConfig` либо хранятся
в конфигурации проекта для `configFromProject`; подключение описано для
[ESLint](./eslint) и [Oxlint](./oxlint).

## Legacy как отдельный слой

Этот вариант оставляет свободную структуру внутри старого кода, но проверяет
его обращения к новым модулям. Например:

<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="app" type="folder">
      <FileTreeNode name="main.ts" type="file" />
    </FileTreeNode>
    <FileTreeNode name="pages" type="folder">
      <FileTreeNode name="profile.ts" type="file" />
    </FileTreeNode>
    <FileTreeNode name="modules" type="folder">
      <FileTreeNode name="User" type="folder" bold>
        <FileTreeNode name="index.ts" type="file" comment="Публичная точка входа" />
        <FileTreeNode name="model.ts" type="file" comment="Реализация закрыта от внешних потребителей" />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="common" type="folder">
      <FileTreeNode name="format.ts" type="file" />
    </FileTreeNode>
    <FileTreeNode name="global" type="folder">
      <FileTreeNode name="env.d.ts" type="file" />
    </FileTreeNode>
    <FileTreeNode name="legacy" type="folder" comment="Свободная внутренняя структура без FEOD-роли" bold>
      <FileTreeNode name="components" type="folder">
        <FileTreeNode name="OldProfile.vue" type="file" />
      </FileTreeNode>
      <FileTreeNode name="services" type="folder">
        <FileTreeNode name="profile.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="old-store.ts" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

::: code-group

```js [ESLint]
import { createConfig } from '@o-feod/eslint-structure-plugin';
import { frontendLayers } from '@o-feod/eslint-structure-plugin/presets';

export default [createConfig({
  layers: {
    ...frontendLayers,
    app: {
      ...frontendLayers.app,
      imports: [...frontendLayers.app.imports, 'legacy'],
    },
    pages: {
      ...frontendLayers.pages,
      imports: [...frontendLayers.pages.imports, 'legacy'],
    },
    modules: {
      ...frontendLayers.modules,
      imports: [...frontendLayers.modules.imports, 'legacy'],
    },
    legacy: { imports: ['legacy', 'modules', 'common'] },
  },
})];
```

```ts [Oxlint]
import { defineConfig } from 'oxlint';
import { createConfig } from '@o-feod/oxlint-structure-plugin/configs';
import { frontendLayers } from '@o-feod/oxlint-structure-plugin/presets';

export default defineConfig(createConfig({
  layers: {
    ...frontendLayers,
    app: {
      ...frontendLayers.app,
      imports: [...frontendLayers.app.imports, 'legacy'],
    },
    pages: {
      ...frontendLayers.pages,
      imports: [...frontendLayers.pages.imports, 'legacy'],
    },
    modules: {
      ...frontendLayers.modules,
      imports: [...frontendLayers.modules.imports, 'legacy'],
    },
    legacy: { imports: ['legacy', 'modules', 'common'] },
  },
}));
```

:::

Выберите вкладку своего линтера. Политика слоёв одинакова; различаются импорты
функций и формат итогового конфига.

У `legacy` нет `role`: он не обязан иметь `index.*`, приватные подмодули или
другую внутреннюю структуру FEOD. Импорты `legacy → legacy` разрешены.
Новый код из `app`, `pages` и `modules` временно может импортировать legacy-файлы.
`common` остаётся независимым от legacy.

### Проверьте границу на файлах

Выберите `legacy/services/profile.ts`: импорты в публичный API и старое хранилище
разрешены, а прямой импорт `User/model.ts` нарушает границу. Маркеры у строк
объясняют, почему каждый путь разрешён или запрещён.

<div class="lint-example">

<!-- @include code-view: ./_examples/legacy-boundary -->

</div>

Если старые файлы разбросаны по нескольким каталогам, опишите несколько слоёв
без ролей, задайте их `dir` и явно разрешите нужные связи. Не добавляйте эти
каталоги в `ignore`, если хотите контролировать их границы.

По мере переноса функциональности удаляйте разрешения `modules → legacy`,
затем `pages → legacy` и `app → legacy`. Когда старый код исчезнет, удалите слой.

## Полное исключение старых директорий

Для первого запуска можно исключить legacy целиком:

```json
{
  "rootDefault": {
    "ignore": ["src/legacy/**", "src/old-components/**"]
  }
}
```

Пути считаются от `rootDir` проекта. Архитектурные правила пропускают эти файлы;
правила языка и фреймворка ESLint/Oxlint могут продолжать их проверять.

::: warning Граница тоже исключается
В `layer-imports` проверяется как исходный файл, так и цель импорта. Если цель
попала в FEOD `ignore`, импорт в неё пропускается. Новый модуль сможет обращаться
к любым legacy-внутренностям. <CodeAnnotation marker="warn">FEOD ignore проверяется и для разрешённой цели импорта: исключённый каталог не защищает границу.</CodeAnnotation> Это способ временно снять контроль, а не сохранить
инкапсуляцию на границе. Политика неразрешённых импортов проверяется раньше
исключения разрешённой цели: отсутствующий файл может по-прежнему дать ошибку.
:::

Удаляйте маски по мере миграции каталогов. Общего baseline, который запоминает
старые нарушения и запрещает только новые, у инструмента сейчас нет.

## Отдельный корень для новой части

Если код можно физически разделить, начните с одного явного корня:

```json
{ "roots": { "src/new": {} } }
```

Слои находятся внутри `src/new`: `src/new/app`, `src/new/modules` и так далее.
`src/legacy` не принадлежит ни одному FEOD-корню и не проверяется. Это также
означает, что обычная проверка слоёв не контролирует импорты между новой частью
и кодом вне корней. Дополнительные политики, например `extra.confine`,
могут задавать отдельные ограничения.

Добавление legacy вторым корнем не делает его свободной зоной: между корнями
действует `dependencies` и разрешены только публичные API модулей целевого корня.
Для свободной legacy-структуры с проверяемой границей удобнее слой без роли.

## Начать с предупреждений или отдельных правил

В ESLint можно ограничить FEOD конфигурацию через `files`. Для плавного
включения отдельных проверок меняйте severity, сохраняя options:

```js
import { configFromProject } from '@o-feod/eslint-structure-plugin';

const config = configFromProject();
const [, options] = config.rules['feod-structure/layer-imports'];
config.rules['feod-structure/layer-imports'] = ['warn', options];
export default [config];
```

В Oxlint используется тот же приём с `configFromProject` из `/configs`.
После исправления нарушений замените `warn` на `error` и включите дополнительные
проверки публичных entry-файлов и циклов.

`files` и отключение правила у импортирующего legacy-файла не запрещают другому
файлу импортировать его. Это отличается от FEOD `ignore`, который проверяет
и цель импорта. Кроме того, `inventory.uncovered`, `module-names`, `module-entries`
и правила циклов сканируют файловую систему: одного `files`-фильтра линтера
недостаточно, чтобы исключить файл из такого анализа. Задавайте область через
FEOD-корни и `ignore`, учитывая потерю контроля границы.
