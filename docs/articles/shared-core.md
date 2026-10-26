---
layout: doc
---

# Одно ядро для нескольких приложений

Когда у проекта несколько точек входа (браузер, сервер, десктопный процесс, CLI), общий код хочется держать в одном месте и при этом не дать клиенту утащить в бандл серверные зависимости. FEOD решает это корнями: каждое приложение получает свой корень со своими слоями, а общее лежит в корне-ядре.

Статья разбирает схему, которая используется в Projector — локальном лаунчере с веб-интерфейсом, сервером, нативной GTK-палитрой и CLI. Конфигурации ниже сокращены, а вывод линтера получен на пробном проекте с той же политикой.

## Раскладка корней

| Корень | Слои | Что внутри |
| --- | --- | --- |
| `src` | `frontendLayers` | клиент: страницы, модули интерфейса |
| `server` | `backendLayers` | HTTP-маршруты, middleware, серверные модули |
| `native` | по умолчанию | процесс с нативным окном |
| `cli` | `libraryLayers` | запуск, перезапуск, установка |
| `core` | `libraryLayers` | модули, общие для всех: контракты, чистая логика и Node-модули |

Зависимости идут в одну сторону: `src`, `server`, `native` и `cli` зависят от `core`, а `core` не зависит ни от кого. Приложения друг друга тоже не импортируют: серверная логика не попадает в клиент, а клиентские компоненты — на сервер.

```js
// feod.config.mjs
import { backendLayers, libraryLayers } from "@o-feod/oxlint-structure-plugin/presets";

export default {
  rootDefault: {
    layerAliases: { "@core": "core/modules" },
    imports: { computed: "forbid", unresolved: "forbid" },
    cycles: { modules: true, types: "include" },
    modules: { publicEntries: ["index.ts"], requirePublicEntry: true },
  },
  roots: {
    src: { dependencies: ["core"] },
    server: { layers: backendLayers, dependencies: ["core"] },
    native: { dependencies: ["core"] },
    core: { layers: libraryLayers },
    cli: { layers: libraryLayers, dependencies: ["core"] },
  },
};
```

Из чужого корня видны только публичные входы модулей `core`. Приватные файлы, обычные подмодули, `app` и `common` другого корня недоступны ([правила корней](/linting/configuration#несколько-корнеи-и-наследование)).

## Что кладут в ядро

- **Контракты** — типы и схемы, которые нужны обеим сторонам: форма проекта, запросов к API, событий. Клиент и сервер описывают одни и те же данные в одном месте.
- **Чистая логика** — поиск и ранжирование, раскладка графа, парсеры. Её можно запускать и в браузере, и на сервере, и в тесте.
- **Node-модули** — доступ к системе. Они лежат в том же `core`, но недоступны браузеру (об этом ниже).

Состав ядра растёт модулями, поэтому правила для него те же, что для любого корня: публичный вход, отсутствие циклов, запрет имён вроде `shared` и `utils`.

## Почему одних корней недостаточно

Корень `core` один, а потребителей у него три, и не всем нужны Node-модули. Направление «клиент → ядро» разрешено, поэтому клиент может импортировать и `core/modules/os`, который читает `/proc` и запускает процессы. Корни этого не запретят, потому что с точки зрения слоёв это обычный публичный модуль ядра.

Граница между «ядром для всех» и «ядром для Node» проводится отдельной политикой — `extra.confine`.

### Платформенные пакеты — только модулям ОС

```js
const nodeOnly = [
  {
    name: "node-platform",
    imports: ["node:**", "node-pty", "ws"],
    allowedIn: ["core/modules/os/**", "core/modules/app-paths/**"],
    message: "Platform dependency in domain code",
  },
];
```

Запись подключается к `core` и `src`. Корень `server` её не получает: серверу разрешено знать о платформе. Пример нарушения в модуле ядра:

```text
core/modules/launcher/bad.ts   Platform dependency in domain code   feod-structure/confine   (import 'node:fs/promises')
```

### Сам модуль ОС — не для клиента

Второе ограничение запрещает потребителям ядра, кроме сервера, импортировать модуль `os`. Его легко записать по псевдониму:

```js
{ name: "no-os-in-browser", imports: ["@core/os", "@core/os/**"], allowedIn: ["core/modules/os/**"] }
```

Эта запись ловит `import ... from '@core/os'`:

```text
src/modules/Search/index.ts   import '@core/os' is confined by 'no-os-in-browser' to 'core/modules/os/**'
```

Но у неё есть слепое пятно: `imports` сравнивается со спецификатором в том виде, как он написан. Тот же модуль, подключённый относительным путём, проходит без замечаний:

```ts
import { os } from '../../../core/modules/os'   // не замечено правилом с imports
```

Документация Projector прямо называет это ограничением. Закрыть его можно полем `targets`, которое работает по пути файла, на который разрешился импорт:

```js
{
  name: "no-os-in-browser",
  targets: ["core/modules/os/**"],
  allowedIn: ["core/modules/os/**", "server/**"],
}
```

Теперь результат не зависит от записи пути:

```text
src/modules/Search/index.ts   import '@core/os' is confined by 'no-os-in-browser' to 'core/modules/os/**', 'server/**'
src/modules/Search/index.ts   import '../../../core/modules/os' is confined by 'no-os-in-browser' to 'core/modules/os/**', 'server/**'
core/modules/launcher/index.ts   import '../os' is confined by 'no-os-in-browser' to ...
```

Последняя строка показывает цену: `allowedIn` задаёт всех, кому разрешено, включая другие модули `core`. Если `launcher` из ядра должен вызывать `os`, его нужно добавить в список или вынести эту часть на сервер. Это полезное давление: оно показывает, какие части «общего» ядра на самом деле серверные.

`targets` работает только для импортов, которые удалось разрешить. Неразрешённые пропускаются, поэтому `imports.unresolved: "forbid"` включают вместе с ним.

### Платформенные строки — только своему адаптеру

Платформа утекает не только через импорты. `/proc/cpuinfo`, `powershell.exe`, `osascript` — это строки, и их тоже можно закрепить за адаптером. Поле `literals` принимает регулярные выражения для статических строк:

```js
const adapters = [
  {
    name: "linux-adapter",
    literals: ["^/proc(/|$)", "^(xdotool|xprop|wmctrl)$"],
    allowedIn: ["core/modules/os/modules/linux/**"],
    message: "Linux-specific operations live in the Linux adapter",
  },
  {
    name: "windows-adapter",
    literals: ["powershell\\.exe|taskkill"],
    allowedIn: ["core/modules/os/modules/windows/**"],
  },
];
```

```text
core/modules/launcher/bad.ts   Linux-specific operations live in the Linux adapter   feod-structure/confine   (строка '/proc/self')
```

Это текстовая эвристика: строка, собранная в рантайме (`'/pr' + 'oc'`), правило не видит. Но от случайного «быстрого» вызова `xdotool` из прикладного модуля она защищает хорошо, а в обзоре кода такая строка сразу заметна. Список закрепляемых строк команда пишет сама: встроенного нет.

## Адаптер как модуль, а не как слой

В Projector нет слоя `adapters`. Системный адаптер — обычный модуль `core/modules/os` с фасадом и приватными подмодулями:

<FileTree>
  <FileTreeNode name="core" type="folder">
    <FileTreeNode name="modules" type="folder" fractal>
      <FileTreeNode name="os" type="folder" bold comment="фасад и выбор платформы">
        <FileTreeNode name="index.ts" type="file" comment="export const os = ..." />
        <FileTreeNode name="modules" type="folder" fractal>
          <FileTreeNode name="linux" type="folder"><FileTreeNode name="index.ts" type="file" /></FileTreeNode>
          <FileTreeNode name="windows" type="folder"><FileTreeNode name="index.ts" type="file" /></FileTreeNode>
        </FileTreeNode>
      </FileTreeNode>
      <FileTreeNode name="launcher" type="folder" comment="пользуется только os.*" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

```ts
// core/modules/os/index.ts
import { linux } from './modules/linux'
import { windows } from './modules/windows'

export const os = process.platform === 'win32' ? windows : linux
```

С `submodules.visibility: "parent-only"` подмодули платформ недоступны никому, кроме фасада:

```text
core/modules/launcher/bad.ts   submodule 'os/modules/linux' is private to its immediate parent   feod-structure/layer-imports
```

Потребители вызывают `os.processes.list()` и не знают, какая платформа под ним. Новая ОС добавляется подмодулем и регистрацией в фасаде; остальной код не меняется. Для неподдерживаемой системы Projector бросает `UnsupportedPlatformError`, а не подставляет чужую реализацию — этот выбор принимает автор адаптера, линтер его не требует.

Чем это отличается от слоя `adapters` из [статьи про бэкенд](/articles/backend#шаг-1-слои-адаптеров):

| | Слой `adapters` | Адаптер-модуль с фасадом |
| --- | --- | --- |
| Где живёт | отдельный слой, реализует порты модулей | модуль ядра, его используют напрямую |
| Направление зависимости | адаптер зависит от модуля-владельца порта | потребитель зависит от фасада |
| Что скрыто | вся технология за портом | реализации платформ за фасадом |
| Когда подходит | один порт — одна замена (база, очередь) | один вызов — несколько реализаций по окружению |

Подходы сочетаются: порты и слой `adapters` удобны для хранилищ и очередей, фасад — для того, что различается по ОС.

## Что проверено, а что нет

Проверено на пробном проекте с политикой выше: `confine` по `imports`, по `targets` и по `literals`; приватность подмодулей при `parent-only`; обход через относительный путь для `imports` и его закрытие через `targets`.

Остаётся за пределами проверки:

- значения, собранные в рантайме, и динамические `import()` (для них нужен `imports.computed: "forbid"`);
- глобальные объекты (`process`, `fetch`) — они не требуют импорта;
- содержимое `package.json` ядра, если оно станет отдельным пакетом.

Про соседние темы: как не дать ядру разрастись — в [статье про ежедневные проверки](/articles/daily-checks), как строить чистое ядро сервера — в [FEOD для бэкенда](/articles/backend#ядро-и-платформа).
