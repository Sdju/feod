---
title: Конфигурация FEOD
---

# Конфигурация FEOD

Конфигурация описывает расположение слоёв и выбранные варианты структуры.
ESLint и Oxlint должны получать из неё одинаковые настройки общих правил.

::: info Версия документации
Справочник описывает API, доступные в плагинах `0.1.5` и новее. В `0.1.0`
эти API отсутствуют: для неё передавайте настройки через опции правил, как
показано в [ESLint](./eslint) и [Oxlint](./oxlint).
:::

## Где хранить конфигурацию

Рекомендуемый вариант — секция `feod` в `package.json`. Остальные поля
`package.json` остаются обычными настройками проекта.

```json
{
  "$schema": "https://feod.dev/feod.package.schema.json",
  "name": "my-app",
  "private": true,
  "feod": {
    "rootDefault": {
      "layerDirs": { "global": "globals" }
    }
  }
}
```

Если настройки удобнее держать отдельно, используйте `feod.config.json`:

```json
{
  "$schema": "https://feod.dev/feod.schema.json",
  "rootDefault": { "layerDirs": { "global": "globals" } },
  "roots": { "src": {} }
}
```


Расширения включаются отдельно, по необходимости. Например, для сквозного модуля:

```json
{
  "$schema": "https://feod.dev/feod.schema.json",
  "rootDefault": { "transitModules": ["package-manager"] }
}
```

Для отдельного файла и `package.json` используются разные схемы:
[feod.schema.json](/feod.schema.json) проверяет объект конфигурации,
[feod.package.schema.json](/feod.package.schema.json) — секцию `feod`
внутри `package.json`. Вторая схема допускает остальные поля пакета, но не
проверяет их: её область ответственности — конфигурация FEOD.

## Несколько корней и наследование

Если `roots` не задан, используется `{ "src": {} }`. Ключи словаря — пути
относительно `rootDir`, значения — переопределения настроек корня.
`rootDefault` задаёт общие настройки, которые наследует каждый корень:

```json
{
  "rootDefault": {
    "layerDirs": { "global": "globals" },
    "common": { "maxDepth": 1 },
    "layerAliases": { "@core": "core/modules" }
  },
  "roots": {
    "src": { "dependencies": ["core"] },
    "server": { "dependencies": ["core"], "common": { "maxDepth": 2 } },
    "core": {}
  }
}
```

При наследовании `layerDirs`, `layerAliases`, `common`, `globals`, `modules`,
`inventory`, `cycles`, `imports`, `submodules` и `extra` объединяются по полям.
Массивы заменяются целиком, включая `dependencies`, `ignore`, `levels`,
`transitModules` и списки внутри политик. Пустой массив сбрасывает унаследованный
список. `layers` заменяет весь набор; вложенный объект `extra.largeFiles` также
заменяется целиком. Стандартные aliases (`@modules`, `@pages` и остальные) и `aliasRoot`
вычисляются для каждого корня отдельно. Настроенные `layerAliases`, `aliasRoot`
и шаблоны `ignore` остаются относительными к общему `rootDir`.

По умолчанию межкорневые импорты запрещены. `dependencies` разрешает направление
зависимости, но только через публичный API модулей целевого корня. Приватные
файлы, обычные вложенные подмодули, `app`, `pages`, `common` и `global` другого
корня остаются недоступны. Публичные входы single-file и transit modules
определяются настройками целевого корня. Правила common продолжают запрещать
бизнес-зависимости, даже когда направление между корнями разрешено.

При вложенных корнях файл принадлежит ближайшему из них. Например, запись
`packages/app/src` получает приоритет перед `packages/app`. Пустой `roots`,
дубли путей после нормализации и неизвестные пути в `dependencies` отклоняются.

`srcRoot` остаётся совместимым вариантом для одного корня:

```json
{ "srcRoot": "source", "layerDirs": { "global": "globals" } }
```

**`srcRoot` и `roots` взаимоисключающие.** Совместное указание — ошибка схемы,
загрузчика и TypeScript-типа. Старые настройки верхнего уровня используются как
общие значения; `rootDefault` имеет приоритет над ними. Загрузчик всегда
возвращает канонический словарь `config.roots`, даже для старого `srcRoot`.
Поля `srcRoot` в нормализованном результате нет. Например, настройки глобального
слоя стандартного корня доступны как `loaded.config.roots.src.layerDirs.global`.

## Импортируемые наборы слоёв

Плагин работает с объектом `layers`, а не с переключателем режимов.
Стандартные наборы экспортируются из `/presets` обоих пакетов:

```js
import { createConfig } from "@o-feod/eslint-structure-plugin";
import { frontendLayers, backendLayers, libraryLayers, cliLayers } from "@o-feod/eslint-structure-plugin/presets";

export default [createConfig({
  rootDefault: { layers: frontendLayers },
  roots: {
    src: { dependencies: ["core"] },
    server: { layers: backendLayers, dependencies: ["core"] },
    core: { layers: libraryLayers },
    cli: { layers: cliLayers, dependencies: ["core"] },
  },
})];
```

В Oxlint `createConfig` импортируется из `/configs`, наборы — из `/presets`.
`layers` заменяет унаследованный набор целиком; для расширения используйте
обычный spread, например `{ ...frontendLayers, jobs: { imports: ["modules"] } }`.
Чтобы слой `app` мог импортировать `jobs`, добавьте `jobs` в его `imports`.
Без `layers` используется `frontendLayers`.

Во всех четырёх наборах есть `common`: он может импортировать только себя,
остальные слои могут импортировать его. `cliLayers` повторяет `frontendLayers`,
заменяя `pages` на `commands`. Слой `commands` сохраняет роль `pages`, включая
изоляцию команд и проверки приватных модулей с префиксом `_`.

Полностью пользовательский набор можно хранить и в JSON:

```json
{
  "rootDefault": {
    "layers": {
      "entry": { "dir": "bootstrap", "imports": ["entry", "domain"] },
      "domain": { "imports": ["domain", "adapter"] },
      "adapter": { "imports": ["adapter"] }
    }
  }
}
```

Ключ — имя слоя, `dir` — каталог внутри корня (по умолчанию совпадает с именем),
`imports` — разрешённые целевые слои этого корня. Импорт собственного слоя
тоже должен быть указан явно. Неизвестные цели, повторяющиеся каталоги и
повторяющиеся роли вызывают ошибку конфигурации. Вложенные каталоги слоёв
выбираются по наиболее длинному совпадению пути.

Необязательный `role` подключает FEOD-семантику: `modules` — публичные входы
модулей, `common` — запрет barrel index и ограничение глубины, `pages` — приватные
модули страниц и module pages, `global` — ambient слой, запрещённый для импорта
из других слоёв. Роли `app` и `pages` не зашивают направления импортов: они
остаются в `imports`. Без соответствующей роли специализированные проверки
этого слоя не применяются. Межкорневой публичный модуль требует роли `modules`.
`layerDirs` остаётся совместимым переопределением каталогов по ролям.

## Варианты структуры модулей

### Однофайловые модули

`singleFileModules: true` разрешает модули непосредственно в слое, например
`src/modules/logger.ts`. Такой файл сам является публичным API; отдельный index
ему не нужен. По умолчанию опция выключена.

### Сквозные модули

`transitModules: ["package-manager"]` включает прямые подмодули контейнера:

<FileTree>
  <FileTreeNode name="package-manager" type="folder" bold>
    <FileTreeNode name="npm" type="folder">
      <FileTreeNode name="index.ts" type="file" comment="Публичный API npm" />
      <FileTreeNode name="install.ts" type="file" comment="Приватная реализация npm" />
    </FileTreeNode>
    <FileTreeNode name="pnpm" type="folder">
      <FileTreeNode name="index.ts" type="file" comment="Публичный API pnpm" />
    </FileTreeNode>
    <FileTreeNode name="_" type="folder" comment="Приватное ядро только для подмодулей контейнера" bold>
      <FileTreeNode name="shared.ts" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Потребитель использует API `package-manager/npm`, а не `npm/install.ts`.
Приватное ядро `_` доступно подмодулям этого контейнера и самому ядру.
У контейнера не требуется общий публичный entry; у его подмодулей entry
проверяется при `modules.requirePublicEntry: true`.

### Страницы внутри модулей

`modulePages: true` включает `src/modules/Name/pages`. Эти файлы подчиняются
ограничениям страниц и не открываются другим слоям напрямую. Исключение —
`src/modules/Name/index.*`: он может импортировать свои страницы, чтобы передать
маршруты в `app` через публичный API модуля. Настройка применяется при наличии
слоёв с ролями `modules` и `pages`; выбор роутера остаётся за фреймворком.

Эти варианты проверяет [layer-imports](./rules/layer-imports).

## Доступ между родителем и подмодулем

Для обычных модулей с ролью `modules` по умолчанию родитель читает ребёнка
через его каталог или `index.*`. Ребёнок может импортировать реализацию
непосредственного родителя, например общий файл `../../shared.ts`, без
возврата через публичный index. Настройки можно задать в `rootDefault`,
в конкретном корне или на верхнем уровне для совместимости:

```json
{
  "rootDefault": {
    "submodules": {
      "parentImports": "public",
      "childImportsParent": "implementation"
    }
  },
  "roots": { "src": {}, "server": {} }
}
```

Оба поля принимают `public` или `implementation` и наследуются по отдельности.
`parentImports: "implementation"` возвращает прежнее разрешение родителю читать
приватные файлы ребёнка. `childImportsParent: "public"` ограничивает обратное
направление публичным API. При переходе с прежнего поведения родительские
импорты приватных файлов ребёнка потребуют миграции или явного
`parentImports: "implementation"`.

На любой глубине определяется непосредственный владелец файла. Импорты
внутри одного модуля разрешены; приватные файлы соседнего подмодуля закрыты.
Политика не разрешает ребёнку читать реализацию всех предков. В обоих пресетах
правило `no-submodule-of-submodule` разрешает собственный глубокий модуль и
непосредственные связи parent/child, но запрещает доступ к глубокому модулю
из постороннего модуля или через несколько уровней сверху.
Сквозные `transitModules` сохраняют отдельную существующую семантику.

Обычные и типовые импорты подчиняются одной политике. Прямой импорт общего
файла позволяет избежать цикла через index родителя, но сам по себе не
проверяет отсутствие циклов: включите `cycles.modules` и/или `cycles.files`
отдельно; см. [правила циклов](./rules/no-module-cycles).

### Приватность публичного API подмодуля

`submodules.visibility` принимает `public` (по умолчанию) или `parent-only`.
Вариант `public` сохраняет возможность соседу или постороннему модулю читать
публичный API неглубокого подмодуля. Вариант `parent-only` закрывает такой доступ,
даже если импортируется index: ребёнка собирает его непосредственный родитель.

```json
{
  "rootDefault": {
    "submodules": {
      "visibility": "parent-only",
      "parentImports": "public",
      "childImportsParent": "implementation"
    }
  },
  "roots": { "src": {}, "server": {} }
}
```

Собственные файлы доступны, непосредственный родитель читает ребёнка согласно
`parentImports`. Доступ ребёнка к непосредственному родителю определяется
`childImportsParent`, в том числе когда родитель сам подмодуль. Остальные
потребители не могут читать ребёнка напрямую; внешнему потребителю возможность
может предоставлять публичный API родителя. Поля наследуются независимо.
Transit-модули имеют прежнюю отдельную политику и не закрываются этой опцией.

`visibility: "public"` не отменяет дополнительного ограничения глубины из
`no-submodule-of-submodule` в обоих пресетах. Опция не проверяет циклы: Projector
отдельно отвергает цикл модульного графа parent → child → parent для значений,
даже если файловый ESM-граф допускает инициализацию.

## Вычисляемые и неразрешённые импорты

По умолчанию неизвестные пути `import()` / `require()` и отсутствующие локальные
файлы пропускаются. Для проектов со статической архитектурой включите проверки:

```json
{
  "rootDefault": { "imports": { "computed": "forbid", "unresolved": "forbid" } },
  "roots": {
    "src": {},
    "server": { "imports": { "computed": "ignore", "unresolved": "ignore" } }
  }
}
```

`imports.computed` принимает `ignore` (по умолчанию) или `forbid`.
`imports.unresolved` принимает `ignore` (по умолчанию) или `forbid`.
Обе настройки применяются правилом `layer-imports`, наследуются корнями и
учитывают `ignore`. При ручном подключении передайте тот же объект `imports`.

В режиме `computed: "forbid"` запрещены переменные, конкатенации, шаблоны с
подстановками и другие неизвестные выражения. Значение даже константной
переменной не вычисляется. Строковые литералы, шаблоны без подстановок и
`import(new URL('./literal.ts', import.meta.url).href)` с незатенённым `URL`
продолжают проходить обычные проверки границ. Вызовы затенённого или
импортированного `require`, а также `loader.require(...)` не считаются загрузкой
модулей. `import()` с затенённым URL или другим основанием остаётся неизвестным
и запрещается. Вычисляемые пути внешних пакетов тоже запрещаются: до разрешения
выражения невозможно определить целевой пакет.

В режиме `unresolved: "forbid"` локальные relative/alias/`srcRoot` импорты, для
которых нет существующего файла (с учётом расширений и index), сообщаются как
`unresolvedImport`. Внешние пакеты, builtins, `node_modules`, virtual/remote/data
specifiers не считаются «пропавшими локальными» файлами. Query/hash суффиксы
(`?raw`, `#hash`) снимаются перед разрешением. Canonical path строится через
`realpath`, когда файл существует. Пользовательские ESLint import resolvers
сохраняются и имеют приоритет.

ESLint использует настроенный пользователем parser; для Vue нужен parser,
открывающий script-блоки правилам ESLint. Oxlint проверяет оба script-блока Vue.
Resolver contract экспортируется как `resolveImport` / `ResolveResult` для tooling
и будущего графа; проверка циклов по-прежнему отдельный этап.

## Публичные entry-файлы

По умолчанию публичными считаются каталог модуля, `index` и непосредственные
файлы `index.*`. Чтобы ограничить явные entry-пути, задайте точные имена:

```json
{
  "rootDefault": { "modules": { "publicEntries": ["index.ts"] } },
  "roots": {
    "src": {},
    "core": { "modules": { "publicEntries": ["api.ts", "public.mts"] } }
  }
}
```

`modules.publicEntries` — имена файлов непосредственно в корне модуля, без
подкаталогов и glob-выражений. При непустом списке `index.js`, `index.internal.ts`
и безрасширительный `index` не разрешены автоматически. Вложенные пути под
entry-файлом тоже не считаются публичными. Массив заменяется при наследовании;
`[]` возвращает стандартную семантику `index.*`. Список независим от
`modules.forbiddenNames`, поэтому переопределение одного не стирает другое.

Настройка используется `layer-imports` и относительным `no-zigzag-imports`;
при ручном подключении этих правил опция называется `publicEntries`.
Она применяется также к публичным входам transit-подмодулей. В межкорневой
связи берётся список **целевого** корня. Собственные файлы, разрешённый доступ
к реализации непосредственного родителя и single-file modules сохраняются.
Приватность подмодулей и ограничения глубины действуют независимо.

Импорт каталога (`@modules/User`) остаётся разрешённым сокращением даже при
точном списке. Это не гарантирует, что bundler выберет этот entry: path fallback
не выполняет такого разрешения. Наличие entry на диске проверяется отдельно
через `modules.requirePublicEntry` и правило `module-entries`. Настройка также
не заменяет конфигурацию bundler, если вместо index используется иной публичный
файл.

## Опциональные структурные правила

### Исходящие локальные импорты globals

`globals.localImports` ограничивает зависимости файлов слоя с ролью `global`:

- `allow` (по умолчанию) сохраняет существующие проверки импортов.
- `type-only` допускает только явно типовые зависимости.
- `forbid` запрещает все локальные зависимости, включая типовые и импорты
  других файлов того же global-слоя.

```json
{
  "rootDefault": {
    "globals": { "allowedFiles": ["**/*.d.ts"], "localImports": "type-only" },
    "imports": { "computed": "forbid" }
  },
  "roots": { "src": { "dependencies": ["core"] }, "core": {} }
}
```

Явно типовыми считаются `import type`, `export type`, declarations только с
`type` specifiers, `import type X = require(...)` и TS type expressions
`import("...")`/`typeof import("...")`. Смешанный импорт или реэкспорт с хотя бы
одним value specifier, пустой импорт/реэкспорт и side-effect import типовыми не
считаются. `require(...)`, dynamic import и literal file URL — value-зависимости.
Наличие `.d.ts` или использование импортированного имени только в типах не
меняет классификацию.

Проверка работает до межкорневой ветки и не требует классификации целевого
слоя: охватывает разрешённые зависимости корней, неклассифицированные локальные
файлы и относительные пути за пределы проекта. Локальными считаются разрешённые
пути внутри `rootDir` и разрешённые относительные/абсолютные specifiers; пути
через `node_modules` исключаются. Внешние bare packages и Node builtins не
ограничиваются. Workspace aliases, разрешённые в файлы проекта, считаются локальными.
Полноценная классификация external/unresolved и canonical paths отложена
до resolver contract; symlinks и неизвестные resolver-у aliases не гарантированы.

Режим `type-only` не отменяет матрицу слоёв, `dependencies`, публичные entries
и приватность модулей. Политика берётся из корня импортирующего файла, включая
ближайший вложенный корень. `globals` наследуется по полям; `localImports: "allow"`
сбрасывает ограничение корня, а `allowedFiles: []` отключает только файловую
проверку. Общий `ignore` применяется к импортирующему и целевому файлу.

Политика применяется к статически распознанным specifiers. Для вычисляемых путей
используйте отдельно `imports.computed: "forbid"`. При ручном подключении
`layer-imports` передавайте `globals: { localImports: "type-only" }` в options.

`cycles.types: "include"` добавляет в `cycles.modules` type-only импорты (как в
Projector), кроме импорта модулем собственного предка; по умолчанию `"ignore"`.
Сквозной контейнер (`transitModules`) не требует собственного `index.ts` для
`modules.requirePublicEntry` — его требуют подмодули.

### Файлы вне корней

Проверки идут только для файлов внутри заданного корня (`roots` или устаревшего
`srcRoot`); файлом владеет ближайший корень. Файл вне всех корней (тесты, скрипты,
конфиги инструментов) не проверяется ни одним правилом, поэтому `ignore` для него не
нужен. `ignore` оставьте для сгенерированных файлов внутри корня.

### Реестр больших файлов (`extra.largeFiles`)

`extra` — группа опциональных правил вне ядра FEOD (`large-files`, `confine`): presets
их не включают, включает конфигурация. `extra.largeFiles` включает
правило `large-files`: файл длиннее порога (`thresholds` по расширению, `default`
по умолчанию 400) нужно либо разбить, либо внести в `files` с `ceiling` и `plan`.
Потолок только снижается: рост выше потолка, сокращение файла (снизить потолок),
возврат в порог (удалить запись) и запись о несуществующем файле — ошибки.
Сообщения называют развилку «разбить или зарегистрировать». Пути — POSIX от корня
проекта; `files` корня заменяет унаследованный реестр.

```json
{ "rootDefault": { "extra": { "largeFiles": {
  "thresholds": { "default": 400, ".vue": 500 },
  "files": { "src/modules/dock/lib/layout.ts": { "ceiling": 620, "plan": "Вынести расчёт панелей" } }
} } } }
```

Таблицу реестра можно сгенерировать из своего скрипта: `largeFilesRows({ rootDir, policy })`
и `renderLargeFilesMarkdown(rows, { title, intro, columns })` (экспортируются и пакетом
Oxlint) считают строки тем же счётчиком, что и правило; путь вывода и тексты задаёт
вызывающий код.

### Ограничение импортов и строк (`extra.confine`)

Правило `confine` выключено в presets и включается непустым списком `extra.confine`
в корне. Запись: `name` (уникальное), `imports` (picomatch-маски по спецификатору как
он написан; `node:**` покрывает `node:fs/promises`), `targets` (маски по пути от корня проекта,
на который разрешается относительный или alias-импорт, так что `../os` судится по цели;
неразрешённые импорты пропускаются), `literals` (исходники
регулярных выражений для статических строк и текста шаблонов), `allowedIn` (маски
от корня проекта; пустой список — нигде), необязательные `allowTypeImports` и
`message`. Источники импортов как литералы не проверяются; вычисляемые пути и
строки, собранные в рантайме, правило не видит. Список в корне заменяет
унаследованный, `[]` отключает.

```json
{
  "rootDefault": {
    "extra": {
      "confine": [
        { "name": "node-only", "imports": ["node:**", "ws"], "allowedIn": ["core/modules/os/**"] },
        { "name": "linux", "literals": ["^/proc(/|$)"], "allowedIn": ["core/modules/os/modules/linux/**"] }
      ]
    }
  }
}
```

### Пути файлов, имена модулей и inventory

Правила `global-files`, `module-names` и `module-entries` выключены в обоих
presets. `createConfig` и `configFromProject` включают соответствующее правило
как `error`, если хотя бы в одном корне выполнены условия и есть нужная FEOD-роль:

```json
{
  "rootDefault": {
    "globals": { "allowedFiles": ["**/*.d.ts", "**/*.d.mts", "**/*.d.cts"] },
    "modules": {
      "forbiddenNames": ["shared", "utils"],
      "requirePublicEntry": true,
      "publicEntries": ["index.ts"]
    },
    "inventory": { "uncovered": true },
    "cycles": { "modules": true, "files": true }
  },
  "roots": {
    "src": {},
    "server": { "globals": { "allowedFiles": [] } }
  }
}
```

`globals.allowedFiles` — glob-шаблоны относительно каталога слоя с ролью `global`,
включая вложенные и скрытые файлы. Для политики Projector можно оставить только
`**/*.d.ts`. Проверяется путь, а не содержимое declarations. Правило не меняет
допустимость исходящих импортов globals. Вложенный пользовательский слой
определяет владельца файла по наиболее длинному пути и не наследует проверку
globals только потому, что расположен под его каталогом.

`modules.forbiddenNames` — точные имена, регистр учитывается. Проверяются имена
верхнего модуля и его подмодулей-владельцев, включая предков посещённого файла.
Каталоги реализации `User/utils`, имена файлов и каталог слоя не проверяются.
При `singleFileModules` имя берётся без последнего расширения; у transit-модуля
проверяются hub и прямой ребёнок, `_` остаётся приватной реализацией hub.
Запрещённые имена принадлежат конфигурации проекта; встроенного списка нет.
Пустые и asset-only владельцы находятся через filesystem inventory и
сообщаются один раз за lint-run.

`modules.requirePublicEntry` включает `module-entries`: у каждого directory /
transit владельца на диске должен быть публичный entry (`publicEntries` или
`index.*`). Single-file modules освобождены. Диагностики дедуплицируются по
владельцу за прогон.

`inventory.uncovered` включает полный обход для `no-unknown-files`: файлы внутри
корня вне известных слоёв сообщаются даже если ESLint их не посетил. По умолчанию
остаётся проверка только посещённых файлов. Inventory строится один раз на
fingerprint `rootDir`/`srcRoot`/опций; API `buildInventory` / `getInventory`
экспортируется для tooling.

`cycles.modules` включает `no-module-cycles`: по файлам модулей из inventory
строятся value-рёбра между `ownerRoot` (type-only не входят), ищутся SCC и
сообщаются один раз за lint-run. `cycles.files` включает `no-file-cycles` для
тех же value-рёбер на уровне файлов по всем слоям FEOD — цикл внутри одного
модуля module-graph не видит. API `buildModuleGraph` / `buildFileGraph`
экспортируется для tooling.

Массивы заменяются целиком при наследовании. Пустой список выключает проверку
для конкретного корня. Общий `ignore` учитывается. Для независимой severity
сохраните сгенерированные options и замените только уровень:

```js
import { createConfig } from "@o-feod/eslint-structure-plugin";

const config = createConfig({ modules: { forbiddenNames: ["utils"] } });
const [, options] = config.rules["feod-structure/module-names"];
config.rules["feod-structure/module-names"] = ["warn", options];
export default [config];
```

Для Oxlint `createConfig` импортируется из `/configs`, экспортируется один объект.
При ручном подключении правил задаются `allowedFiles`, `forbiddenNames`,
`requirePublicEntry` или `filesystem` (uncovered для `no-unknown-files`)
непосредственно в их options. ESLint должен включать нужные расширения в `files`
и использовать настроенный parser пользователя, например для `.d.mts/.d.cts`.
`global-files` по-прежнему смотрит только посещённые файлы; `module-names` /
`module-entries` / uncovered inventory дедуплицируют владельцев и файлы за прогон.

## Параметры

Назначение и примеры каждой проверки приведены в [каталоге правил](./rules/).


| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `roots` | `{ "src": {} }` | Корни исходников и их переопределения |
| `rootDefault` | `{}` | Общие настройки для всех корней |
| `layers` | `frontendLayers` | Каталоги слоёв, роли и разрешённые зависимости |
| `dependencies` | `[]` | Разрешённые целевые корни для межкорневых импортов |
| `srcRoot` | `"src"` | Каталог исходников относительно корня проекта |
| `layerDirs` | `app`, `pages`, `modules`, `common`, `global` | Имена каталогов слоёв относительно `srcRoot` |
| `aliasPrefix` | `"@"` | Префикс алиаса корня исходников, например `@/modules/User` |
| `aliasRoot` | Значение `srcRoot` | Цель алиаса относительно корня проекта |
| `layerAliases` | `@app`, `@pages`, `@modules`, `@common`, `@global` | Дополнительные алиасы или замена стандартных; цели задаются относительно корня проекта |
| `ignore` | Пустой список | Glob-паттерны исключений для правил FEOD |
| `common.maxDepth` | `1` | Допустимая глубина каталогов внутри `common` |
| `transitModules` | Пустой список | Имена сквозных модулей с прямыми подмодулями |
| `singleFileModules` | `false` | Разрешить однофайловые модули |
| `submodules.visibility` | `"public"` | Доступ соседей и посторонних модулей к публичному API ребёнка |
| `submodules.parentImports` | `"public"` | Доступ родителя к ребёнку |
| `submodules.childImportsParent` | `"implementation"` | Доступ ребёнка к непосредственному родителю |
| `imports.computed` | `"ignore"` | Политика неизвестных путей `import()` и `require()` |
| `imports.unresolved` | `"ignore"` | Политика локальных импортов без существующего файла |
| `globals.allowedFiles` | `[]` | Допустимые glob-шаблоны файлов globals; пустой список выключает проверку |
| `modules.publicEntries` | `[]` | Точные имена публичных файлов; пустой список сохраняет `index.*` |
| `modules.forbiddenNames` | `[]` | Запрещённые имена модулей; пустой список выключает проверку |
| `modules.requirePublicEntry` | `false` | Требовать публичный entry на диске для каждого владельца модуля |
| `inventory.uncovered` | `false` | Сообщать файлы вне слоёв через filesystem inventory |
| `cycles.modules` | `false` | Детектировать value-циклы между владельцами модулей |
| `cycles.types` | `"ignore"` | Учитывать type-only зависимости в модульных циклах при `"include"` |
| `cycles.files` | `false` | Детектировать value-циклы между исходными файлами слоёв |
| `modulePages` | `false` | Разрешить страницы внутри модулей |
| `levels` | Пустой список | Настройки правила `visibility-levels` в пресете `strict` |

Имя слоя — `global`. Если каталог называется `globals`, задайте
`layerDirs.global: "globals"`, как в примерах выше. Существующий каталог по
умолчанию в плагинах сохраняется, чтобы обновление не меняло поведение проектов.

Элементы `levels` содержат `name`, `visibility` (`default`, `transparent` или
`open`) и необязательный `maxDepth`. Глубина — целое неотрицательное число.
Пустой список не добавляет ограничений даже в `strict`. Подробнее о семантике
видимости — в разделе [модулей](/structure/modules).

Пресет и настройки самого линтера выбираются в `eslint.config.js` или
`oxlint.config.ts`. Конфигурация FEOD не задаёт парсер, список линтируемых файлов,
правила сторонних плагинов или настройки resolver.

## Подключение к линтеру

В ESLint используйте `configFromProject`: функция загружает конфигурацию из
корня проекта и возвращает flat config с регистрацией плагина и правилами.

```js
// eslint.config.js
import { configFromProject } from "@o-feod/eslint-structure-plugin";

export default [
  {
    ...configFromProject(),
    files: ["src/**/*.{js,ts,tsx,vue}"],
  },
];
```

Парсеры для TypeScript и Vue подключаются отдельно, как в обычном ESLint-проекте.
В Oxlint функция возвращает его конфигурацию с `jsPlugins`:

```ts
// oxlint.config.ts
import { defineConfig } from "oxlint";
import { configFromProject } from "@o-feod/oxlint-structure-plugin/configs";

export default defineConfig(configFromProject());
```

Общие параметры обеих функций:

- `rootDir`: корень проекта; по умолчанию текущий рабочий каталог.
- `preset`: `"recommended"` по умолчанию или `"strict"` для проверки видимости.

В workspace-проектах задавайте корень явно. В ESM-конфигурации его можно
вычислить через `fileURLToPath(new URL(".", import.meta.url))` из `node:url`.

Чтобы передать объект непосредственно, используйте `createConfig(config,
options)`. Он проверяет объект и строит пресет, но не читает файлы:

```js
import { createConfig } from "@o-feod/eslint-structure-plugin";

export default [createConfig({
  layerDirs: { global: "globals" },
  common: { maxDepth: 1 },
}, { preset: "strict" })];
```

У Oxlint `createConfig` экспортируется из `@o-feod/oxlint-structure-plugin/configs`.
`loadFeodConfig({ rootDir })` экспортируется из корня обоих пакетов и возвращает
`{ rootDir, config, filepath }`: нормализованные настройки и путь источника.
Если источник отсутствует, `filepath` отсутствует, а `config.roots.src` содержит
стандартные значения. `config.rootDefault` хранит общие настройки, а `config.roots`
— вычисленные настройки каждого корня. `$schema` не входит в нормализованный результат.

Правила можно переопределять обычным способом после создания пресета:

```js
import { configFromProject } from "@o-feod/eslint-structure-plugin";

const feod = configFromProject();
export default [{
  ...feod,
  rules: { ...feod.rules, "feod-structure/no-common-deep": "off" },
}];
```

Статические `recommended` и `strict` остаются доступными и не загружают JSON
автоматически. Чтение файлов происходит только при вызове загрузчика или
`configFromProject`.

## Контракт загрузки

Загрузчик работает по следующим правилам:

1. Корень проекта задаётся явно; по умолчанию используется текущий рабочий каталог.
2. В этом каталоге проверяются `feod.config.json` и секция `feod` в `package.json`.
   Поиск по родительским каталогам не выполняется, чтобы настройки соседних
   workspace-пакетов не влияли друг на друга.
3. Если заданы оба источника, загрузка завершается ошибкой с указанием путей.
   Чтобы продолжить, оставьте один источник.
4. Если ни одного источника нет, используются стандартные настройки.
5. Неизвестные поля, неверные типы и некорректный JSON вызывают ошибку с указанием
   файла и поля. Ошибки не подменяются стандартными настройками.
6. Пути должны быть относительными: абсолютные Unix- и Windows-пути отклоняются.
   Разделители и сегменты `.` нормализуются. Все пути разрешаются относительно корня проекта. `rootDir` передаётся
   правилам загрузчиком и не хранится в переносимой JSON-конфигурации.
7. Каждый пресет передаёт правилу только поддерживаемые им параметры.
   `$schema` используется редактором и не попадает в опции правил.

## Границы первого контракта

Запрет `index.*` в `common` и префикс `_` для приватных модулей страниц
остаются правилами FEOD. Публичные входы модулей по умолчанию — `index.*`;
точные имена задаются через `modules.publicEntries`. Настройки `allowIndex`,
`publicEntry`, `allowDeepImports`, `privateModulesPrefix` и
`useFileBasedRouting` не входят в этот контракт: текущие правила их не
поддерживают. Выбор роутинга выполняется средствами фреймворка.

Схема не устанавливает значения по умолчанию самостоятельно. Это задача
загрузчика и построителя пресетов. Каноническая схема находится в ESLint-пакете;
её копия для сайта синхронизируется командой `node scripts/sync-feod-schema.mjs`
из корня репозитория и проверяется тестами.
