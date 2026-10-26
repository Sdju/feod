# Projector и FEOD: состояние миграции

Актуально на 2026-10-26. Опубликован `@o-feod/*-structure-plugin@0.1.5`; версия
`0.1.4` отдельно не выпускалась, её изменения вошли в `0.1.5`: помощники отчёта
по реестру больших файлов, `confine.targets`, пропуск файлов вне корней.
Состояние Projector ниже на 2026-10-06 не перепроверялось.

В Projector старый checker заменён конфигом FEOD на ветке `feod-plugin-config`
(не закоммичена). Её проверки: `vp run architecture`, `vp run test:architecture`
(10 тестов на fixture-проектах с настоящим конфигом), сборка `vp build`;
`vp lint` показывает те же диагностики по файлам. Полный `vp run check` (тесты с
GTK и Docker) не запускался. Политика лежит в `feod.config.mjs`, запуск —
`scripts/check-feod.mjs` (Oxlint только с правилами FEOD). Удалены
`scripts/check-architecture.mjs`, `scripts/architecture-boundaries.mjs`,
`architecture.config.json`.

## Что делает конфиг Projector

| Старая проверка | Теперь |
| --- | --- |
| Слои и направления импортов | `layers` (`frontendLayers`, `backendLayers`, `libraryLayers`) по корням |
| Корни и межкорневые зависимости | `roots` + `dependencies`, только публичные верхние модули |
| Публичный `index.ts`, приватность подмодулей | `modules.publicEntries: ["index.ts"]`, `requirePublicEntry`, `submodules.visibility: "parent-only"` |
| Сквозные модули | `transitModules: ["agents-integration"]` в `src`, `server`, `core`; контейнер входа не требует |
| Globals | `globals.allowedFiles: ["**/*.d.ts"]`, `localImports: "forbid"` |
| Запрещённые имена модулей | `modules.forbiddenNames: ["common", "shared", "utils"]` |
| Существование импортов, aliases, `realpath` | `imports.unresolved: "forbid"`, `layerAliases` |
| Вычисляемые пути | `imports.computed: "forbid"`; литеральный `new URL(..., import.meta.url)` разрешён |
| Циклы модулей | `cycles.modules` + `cycles.types: "include"` (type-only рёбра считаются, кроме импорта предка) |
| `node:`, `node-gtk`, `dbus-next`, `node-pty`, `ws`, модули `os`/`app-paths` | `extra.confine` в корнях `src` и `core` |
| Строки Linux и Windows вне адаптеров | `extra.confine` (текстовая эвристика) |
| Реестр больших файлов | `extra.largeFiles` (порог по расширению, потолок, план; потолок только снижается) |
| Неохваченные файлы | `inventory.uncovered` |

На реальном дереве диагностик FEOD нет. Совпадение с прежним checker проверено на
временных фикстурах: приватные импорты, `node:fs` в `src`, строки Linux и Windows,
файл в 450 строк, value-цикл и type-only цикл. Остальные оговорки ниже.

## Что хуже, чем было

- **Нет проверки на каждое изменение.** Раньше полный check шёл при каждом HMR.
  Теперь одна проверка на `buildStart` (около 6,5 с) плюс `vp lint` и редактор.
- **`os` и `app-paths`.** Запрет импорта из `src` и не-`os` модулей `core` задан
  для алиасов `@core/os`, `@core/app-paths`; относительный путь в обход алиаса
  не ловится. В `0.1.5` это закрыто `confine.targets` (проверка по
  разрешённому пути цели), в конфиг Projector пока не перенесено.
- **Файлы вне корней.** В `0.1.3` FEOD применял к ним правила первого корня,
  поэтому в конфиге Projector вручную исключены `tests`, `scripts`, `docs`, `bin`,
  `public`, `resources`, `dist`, `**/*.config.*`. Начиная с `0.1.5` файлы вне
  корней не проверяются, и этот `ignore` станет не нужен.
- **Диагностики по всему дереву** (`module-entries`, неохваченные файлы) привязаны
  к первому проверяемому файлу, а не к проблемному.
- **Размер файлов** считается только по файлам, которые видит линтер (раньше —
  и `.py`).
- **Таблица `docs/large-files.md`** больше не генерируется: реестр пуст, файл
  надо либо удалить, либо подключить `largeFilesRows` / `renderLargeFilesMarkdown`
  из `0.1.5`.

## Что есть в FEOD

Опубликовано в `0.1.3`: `layers`, `roots` / `rootDefault` / `dependencies`,
`transitModules`, `submodules` (`parent-only`, `parentImports`,
`childImportsParent`), `globals.allowedFiles` / `localImports`, `modules`
(`publicEntries`, `requirePublicEntry`, `forbiddenNames`), `inventory.uncovered`,
`imports` (`computed`, `unresolved`), `cycles` (`modules`, `files`, `types`),
`extra.confine`, `extra.largeFiles`. Правила `global-files`, `module-names`,
`module-entries`, `no-module-cycles`, `no-file-cycles`, `confine`, `large-files`
выключены в обоих presets и включаются конфигурацией. Подробнее:
[конфигурация FEOD](linting/configuration.md).

Извлекатель зависимостей: imports и reexports, type imports, `TSImportType`,
import-equals, `import()` и `require` с литералом, `new URL(..., import.meta.url)`.
Не извлекаются `import.meta.glob`, workers и прочие загрузчики. Vue-блоки
`<script>` в графе разбираются регулярным выражением (в Projector так же).

В `0.1.3` исправлено найденное при подключении Projector: транзитный контейнер
больше не требует `index.ts`, а `cycles.types: "include"` добавлен для паритета
по type-only циклам.

## Что осталось

Приоритет сверху вниз.

1. В Projector: закоммитить ветку, открыть PR, прогнать `vp run check`; вернуть
   обратную связь на каждое изменение через `vite-plugin-checker` (режим Oxlint,
   версию и режим проверить при установке); решить судьбу `docs/large-files.md`.
2. В FEOD:
   - перенести в конфиг Projector `confine.targets` и убрать лишний `ignore`
     после обновления до `0.1.5`;
   - привязка диагностик, касающихся всего дерева (`module-entries`, пустые модули),
     к первому проверяемому файлу: отчитывать на файлах самого модуля и решать
     остаток через программный API;
   - программный API / CLI проверки проекта (отложено): убирает обёртку
     `check-feod.mjs`.
3. Позже: настоящий Vue-парсер, `import.meta.glob` и workers, watch /
   invalidation (после CLI нужен только для оптимизации), усиление fixture-тестов
   Projector (часть проверок лишь убеждается, что файл попал под какое-нибудь
   правило).

## Вне FEOD

Платформенные ограничения (`os`, Linux, Windows) заданы как проектная политика
через `extra.confine`: список шаблонов и путей адаптеров принадлежит Projector.
Это не встроенные правила FEOD. Pages routing patterns и «вырастил page-module» —
в TODO FEOD и миграцию Projector не блокируют.

Основание: `packages/eslint/src`, `packages/oxlint/src` и их тесты; Projector
`feod.config.mjs`, `scripts/check-feod.mjs`, `tests/architecture.test.mjs`,
`docs/architecture.md`, `vite.config.ts`.
