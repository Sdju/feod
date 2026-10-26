---
layout: doc
---

# FEOD для бэкенда и BFF

::: warning Экспериментально
Применение FEOD вне фронтенда остаётся [открытым вопросом](/base/extensions#использование-feod-за-пределами-фронтенд-приложений). Набор слоёв `backendLayers` есть в плагинах и применяется в одном реальном проекте — Projector (локальный сервер-лаунчер); приёмы оттуда помечены в тексте. Всё, что описано как результат работы линтера, прогонялось на тестовых проектах с текущей версией плагина. Это не опыт промышленной эксплуатации: открытые места перечислены в конце.
:::

FEOD не привязан к браузеру: слои и направления импортов задаёт конфигурация, а не зашитый список. Для сервера в плагинах есть готовый набор `backendLayers`. Статья идёт от него к более строгим вариантам: от «модули не знают о маршрутах» до «бизнес-ядро физически не может обратиться к базе, файловой системе или фреймворку».

## Набор слоёв

| Слой | Может импортировать | Роль |
| --- | --- | --- |
| `app` | `app`, `routes`, `middlewares`, `modules`, `common` | `app` |
| `routes` | `modules`, `common` | нет |
| `middlewares` | `modules`, `common` | нет |
| `modules` | `modules`, `common` | `modules` |
| `common` | `common` | `common` |
| `global` | все слои, включая `global` | `global` |

Направление то же, что на фронтенде, только `pages` заменён двумя параллельными слоями. `routes` и `middlewares` стоят над `modules` и друг друга не знают. Подробнее о самих наборах — в [конфигурации](/linting/configuration#импортируемые-наборы-слоев).

Подключение:

```js
// eslint.config.js
import { createConfig } from "@o-feod/eslint-structure-plugin";
import { backendLayers } from "@o-feod/eslint-structure-plugin/presets";

export default [createConfig({
  rootDefault: { layers: backendLayers },
  roots: { src: {} },
})];
```

В Oxlint `createConfig` берётся из `@o-feod/oxlint-structure-plugin/configs`, наборы — из `/presets`.

## Пример

<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="app" type="folder" bold>
      <FileTreeNode name="entry.ts" type="file" comment="сборка зависимостей" />
    </FileTreeNode>
    <FileTreeNode name="routes" type="folder" bold>
      <FileTreeNode name="users" type="folder">
        <FileTreeNode name="get.ts" type="file" />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="middlewares" type="folder" bold>
      <FileTreeNode name="auth.ts" type="file" />
    </FileTreeNode>
    <FileTreeNode name="modules" type="folder" bold>
      <FileTreeNode name="Users" type="folder"><FileTreeNode name="index.ts" type="file" /></FileTreeNode>
      <FileTreeNode name="Auth" type="folder"><FileTreeNode name="index.ts" type="file" /></FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="common" type="folder" bold>
      <FileTreeNode name="log.ts" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Модули не знают ни о маршрутах, ни о фреймворке и получают внешние зависимости через параметры:

```ts
// src/modules/Users/index.ts
export interface User {
  id: string
  name: string
}

export interface UserStore {
  find(id: string): Promise<User | null>
}

export function createUsers(store: UserStore) {
  return { getById: (id: string) => store.find(id) }
}
```

```ts
// src/modules/Auth/index.ts
export function createAuth(secret: string) {
  return { verify: (token: string) => token === secret }
}
```

Маршрут и middleware принимают готовый модуль и ничего не знают о хранилище:

```ts
// src/routes/users/get.ts
import type { createUsers } from '@/modules/Users'

type Users = ReturnType<typeof createUsers>

export const createGetUser = (users: Users) => async (id: string) => {
  const user = await users.getById(id)
  return user ? { status: 200, body: user } : { status: 404, body: null }
}
```

```ts
// src/middlewares/auth.ts
import type { createAuth } from '@/modules/Auth'

type Auth = ReturnType<typeof createAuth>

export const createAuthGuard = (auth: Auth) => (token: string) => auth.verify(token)
```

Собирает всё `app`:

```ts
// src/app/entry.ts
import { createAuth } from '@/modules/Auth'
import { createUsers } from '@/modules/Users'
import { createAuthGuard } from '@/middlewares/auth'
import { createGetUser } from '@/routes/users/get'

const users = createUsers({ find: async () => null })
export const guard = createAuthGuard(createAuth('secret'))
export const getUser = createGetUser(users)
```

Это схема границ, а не готовый сервер: HTTP-фреймворк, чтение конфигурации и настоящее хранилище здесь не показаны. Набор файлов проходит линтер с `backendLayers` без ошибок.

## Что проверяет линтер

Нарушения, которые линтер находит на этой структуре:

```text
src/routes/orders.ts       'routes' cannot import from 'routes'
src/routes/users/list.ts   'routes' cannot import from 'routes'      (import { handler } from './get')
src/middlewares/auth.ts    'middlewares' cannot import from 'routes'
src/modules/Users/leak.ts  'modules' cannot import from 'routes'
src/server/x.ts            file is outside known FEOD layers         (feod-structure/no-unknown-files)
```

Две особенности:

- `routes` не импортирует `routes`. В матрице у слоя разрешены только `modules` и `common`, и импорт собственного слоя должен быть указан явно. Это касается и соседнего файла через `./get`.
- Каталог вне слоёв, например `src/server`, получает ошибку `no-unknown-files`. Слои нужно перечислить в `layers`.

## Что включить сразу

Часть проверок выключена по умолчанию, но на сервере дёшево стоит их включить: связей и точек входа немного, а ошибки дорогие.

```js
createConfig({
  rootDefault: {
    layers: backendLayers,
    modules: { requirePublicEntry: true },
    cycles: { modules: true, files: true },
    imports: { computed: "forbid", unresolved: "forbid" },
    inventory: { uncovered: true },
  },
  roots: { src: {} },
})
```

| Настройка | Что даёт на сервере |
| --- | --- |
| `modules.requirePublicEntry` | у каждого модуля есть явный вход, а значит, явный контракт |
| `cycles.modules`, `cycles.files` | взаимные зависимости модулей не прячутся за разрешённым направлением слоёв ([разбор](/articles/module-links)) |
| `imports.computed: "forbid"` | `import(path)` и `require(name)` с динамическим путём запрещены: иначе через них можно обойти любые ограничения ниже |
| `imports.unresolved: "forbid"` | импорт несуществующего локального файла сообщается как ошибка, а не пропускается |
| `inventory.uncovered` | включает полный обход каталогов для `no-unknown-files`: файлы вне слоёв находятся даже там, где их никто не открывал |

Запрет вычисляемых путей особенно важен для серверов: плагины, динамическая загрузка обработчиков и `require` по имени типичны для Node.js, и каждый такой вызов невидим для проверки границ.

## Ядро и платформа

Слои из `backendLayers` отделяют модули от маршрутов, но не отделяют бизнес-логику от платформы. Ничто не мешает файлу из `modules` написать `import { Pool } from 'pg'` или `import { readFile } from 'node:fs/promises'`: для `layer-imports` внешние пакеты и встроенные модули Node не входят в граф слоёв и не ограничиваются.

Дальше последовательно закрываются разные виды утечек. Каждый шаг отдельный, их можно брать по одному.

- **Ядро** — код, который выражает правила предметной области и должен работать так же в тесте, в воркере и в CLI: модули, их типы и порты.
- **Платформа** — всё, что знает про окружение: драйверы БД, HTTP-фреймворк, файловая система, очередь, часы, переменные окружения.

### Шаг 1. Слой адаптеров

Готового слоя для адаптеров в `backendLayers` нет, но набор слоёв — обычный объект, и его можно расширить. Добавим слой `adapters`: он видит модули (чтобы реализовать их порты), модули его не видят, а собирает всё `app`.

```js
// eslint.config.js
import { createConfig } from "@o-feod/eslint-structure-plugin";
import { backendLayers } from "@o-feod/eslint-structure-plugin/presets";

const layers = {
  ...backendLayers,
  adapters: { imports: ["adapters", "modules", "common"] },
};
layers.app = { ...layers.app, imports: [...layers.app.imports, "adapters"] };

export default [createConfig({
  rootDefault: { layers },
  roots: { src: {} },
})];
```

| Слой | Может импортировать |
| --- | --- |
| `app` | `app`, `routes`, `middlewares`, `adapters`, `modules`, `common` |
| `routes`, `middlewares` | `modules`, `common` |
| `adapters` | `adapters`, `modules`, `common` |
| `modules` | `modules`, `common` |
| `common` | `common` |

Порт описан в модуле, реализация лежит в адаптере и зависит от модуля, а не наоборот:

<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="app" type="folder" bold>
      <FileTreeNode name="entry.ts" type="file" comment="соединяет порт и адаптер" />
    </FileTreeNode>
    <FileTreeNode name="adapters" type="folder" bold comment="платформа">
      <FileTreeNode name="pg" type="folder">
        <FileTreeNode name="users.ts" type="file" comment="реализует UserStore" />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="modules" type="folder" bold comment="ядро">
      <FileTreeNode name="Users" type="folder">
        <FileTreeNode name="index.ts" type="file" comment="UserStore и createUsers" />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

```ts
// src/adapters/pg/users.ts
import type { Pool } from 'pg'
import type { UserStore } from '@/modules/Users'

export const pgUsers = (pool: Pool): UserStore => ({
  find: async (id) => {
    const { rows } = await pool.query('select id, name from users where id = $1', [id])
    return rows[0] ?? null
  },
})
```

```ts
// src/app/entry.ts
import { Pool } from 'pg'
import { pgUsers } from '@/adapters/pg/users'
import { createUsers } from '@/modules/Users'

export const users = createUsers(pgUsers(new Pool()))
```

Теперь направление зависимости защищено структурой. Если модуль попытается напрямую взять реализацию, линтер скажет:

```text
src/modules/Users/bad.ts   'modules' cannot import from 'adapters'   feod-structure/layer-imports
src/routes/r.ts            'routes' cannot import from 'adapters'    feod-structure/layer-imports
```

Маршруты тоже не обращаются к адаптерам напрямую: они получают готовый модуль от `app`, как в примере выше.

Адаптеры можно делить на подмодули и по технологии (`pg`, `redis`), и по назначению. Что именно считать адаптером, решает команда: линтер проверяет только направление.

#### Вариант без нового слоя: адаптер как модуль

Отдельный слой нужен не всегда. Если один вызов должен по-разному работать в зависимости от окружения (ОС, режим запуска), адаптер удобнее сделать обычным модулем с фасадом и приватными подмодулями. Так устроен системный адаптер в Projector: потребители вызывают `os.processes.list()`, а подмодули `linux`, `windows` и `darwin` закрыты настройкой `submodules.visibility: "parent-only"`. Подробности и вывод линтера — в [статье про общее ядро](/articles/shared-core#адаптер-как-модуль-а-не-как-слои).

Выбор простой: порты и слой `adapters` — когда у контракта одна замена (база, очередь, почта), фасад с подмодулями — когда реализации различаются по окружению.

### Шаг 2. Платформенные пакеты — только адаптерам

Слой адаптеров защищает направление импортов внутри проекта, но не мешает другим слоям импортировать драйвер напрямую. Для этого есть опциональное правило [confine](/linting/rules/confine): оно привязывает импорты к выбранным файлам. Встроенных запретов нет, список платформенных пакетов задаёт проект.

```js
createConfig({
  rootDefault: { layers },
  roots: { src: {} },
  extra: {
    confine: [{
      name: "platform",
      imports: ["node:**", "pg", "express"],
      allowedIn: ["src/adapters/**"],
      allowTypeImports: true,
    }],
  },
})
```

Результат на проекте из прошлого шага, где в `modules`, `routes`, `app` и `common` намеренно оставлены платформенные импорты:

```text
src/app/entry.ts           import 'pg' is confined by 'platform' to 'src/adapters/**'
src/common/log.ts          import 'node:fs/promises' is confined by 'platform' to 'src/adapters/**'
src/modules/Users/bad.ts   import 'pg' is confined by 'platform' to 'src/adapters/**'
src/modules/Users/bad.ts   import 'node:fs/promises' is confined by 'platform' to 'src/adapters/**'
src/routes/r.ts            import 'pg' is confined by 'platform' to 'src/adapters/**'
```

Что стоит знать:

- **`app` тоже под запретом.** Если `new Pool()` создаётся в `app/entry.ts`, правило сработает и там. Либо фабрику подключения кладут в адаптер (`createPool()` в `adapters/pg`), либо `app` добавляют в `allowedIn`. Первый вариант чище: `app` вообще не знает о драйвере и только соединяет готовые части.
- **Маска `node:**` покрывает любой встроенный модуль**, написанный с префиксом `node:`. Импорт без префикса (`from 'fs'`) маска не поймает: она сравнивается со спецификатором в том виде, как он написан. Договоритесь о стиле записи или перечислите короткие имена явно (`fs`, `path`, `crypto`).
- **`allowTypeImports: true` освобождает явные type-only импорты.** Это удобно в адаптерах, но в ядре оставляет лазейку: `import type { Pool } from 'pg'` в порте протащит тип платформы в контракт. В строгой записи для ядра опцию не включают.
- **Защита целей, а не только пакетов.** Поле `targets` работает по разрешённому пути: можно ограничить, кто вправе импортировать `src/adapters/pg/**`, независимо от того, как написан путь. Для слоёв это уже делает `layer-imports`, но `targets` пригодится для внутренних правил, например «только `app` создаёт клиент почтового сервиса».
- **Строки.** Поле `literals` ловит статические строки, например `'^/etc/'` или `'^/var/run'`. Это способ закрепить за адаптерами пути в файловой системе.
- Правило работает и в ESLint, и в Oxlint.

### Шаг 3. Ядро в отдельном корне

Следующая ступень: вынести ядро в отдельный корень, у которого нет слоёв сервера вовсе. Корни настраиваются независимо, а `dependencies` задаёт единственное разрешённое направление.

<FileTree>
  <FileTreeNode name="project" type="folder">
    <FileTreeNode name="core" type="folder" bold comment="ядро: libraryLayers">
      <FileTreeNode name="modules" type="folder">
        <FileTreeNode name="Orders" type="folder">
          <FileTreeNode name="index.ts" type="file" comment="публичный API и порты" />
        </FileTreeNode>
      </FileTreeNode>
      <FileTreeNode name="common" type="folder" />
    </FileTreeNode>
    <FileTreeNode name="server" type="folder" bold comment="платформа: backendLayers + adapters">
      <FileTreeNode name="app" type="folder" />
      <FileTreeNode name="routes" type="folder" />
      <FileTreeNode name="adapters" type="folder" />
      <FileTreeNode name="modules" type="folder" />
      <FileTreeNode name="common" type="folder" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

```js
// eslint.config.js
import { createConfig } from "@o-feod/eslint-structure-plugin";
import { backendLayers, libraryLayers } from "@o-feod/eslint-structure-plugin/presets";

const serverLayers = {
  ...backendLayers,
  adapters: { imports: ["adapters", "modules", "common"] },
};
serverLayers.app = { ...serverLayers.app, imports: [...serverLayers.app.imports, "adapters"] };

export default [createConfig({
  rootDefault: { imports: { computed: "forbid", unresolved: "forbid" } },
  roots: {
    core: {
      layers: libraryLayers,
      extra: {
        confine: [{
          name: "pure-core",
          imports: ["node:**", "pg", "express"],
          allowedIn: [],
          message: "Ядро не зависит от платформы",
        }],
      },
    },
    server: {
      layers: serverLayers,
      dependencies: ["core"],
      layerAliases: { "@core": "core/modules" },
      extra: {
        confine: [{
          name: "platform",
          imports: ["node:**", "pg", "express"],
          allowedIn: ["server/adapters/**"],
        }],
      },
    },
  },
})];
```

Здесь три разные гарантии:

1. **Направление между корнями.** Ядро не видит сервер, сервер видит только публичный API модулей ядра:

   ```text
   core/modules/Orders/leak.ts   root 'core' cannot import from 'server'              feod-structure/layer-imports
   server/adapters/y.ts          imports from root 'core' must use a public top-level module API   feod-structure/layer-imports
   ```

   Вторая ошибка получена для импорта `@core/Orders/ports`. Если порт нужен адаптеру, его нужно экспортировать из `index.ts` модуля ядра, а не обращаться к файлу напрямую. Это полезное давление: публичный контракт ядра приходится описывать явно.

2. **Ядро без платформы.** Запись с `allowedIn: []` означает «нигде». В ядре запрещены `node:**`, драйвер и фреймворк:

   ```text
   core/modules/Orders/index.ts   Ядро не зависит от платформы   feod-structure/confine   (import ... from 'node:crypto')
   core/modules/Orders/index.ts   Ядро не зависит от платформы   feod-structure/confine   (import ... from 'lodash')
   ```

3. **Платформа только в адаптерах.** Для корня `server` действует та же запись, что и в предыдущем шаге.

Нюансы настройки:

- **`confine` в корне заменяет унаследованный список целиком**, а не дополняет его. Поэтому запрет для ядра и разрешение для сервера лежат в своих корнях, а не в `rootDefault`.
- **Алиасы нужны для импорта между корнями.** В примере `@core` указывает на `core/modules`. Тот же алиас должен быть в `tsconfig.json` и в сборщике: FEOD задаёт правила, но не заменяет настройку разрешения путей.
- **Несколько корней могут жить в одном репозитории или в разных пакетах.** Если ядро выносится в отдельный пакет, корень можно превратить в пакет с собственным `package.json`, но линтер видит только пути проекта.
- **Белый список вместо чёрного.** Если ядру разрешено зависеть только от нескольких пакетов, маска на основе extglob запрещает все остальные: `"!(zod|.*|@*|node:*)"` не трогает `zod`, относительные импорты (`./`, `../`) и алиасы с `@`, а остальные обычные пакеты (в том числе `fs` без префикса) получают ошибку. Проверено на тестовом проекте: `zod` проходит, `lodash` и `fs` нет. Scoped-пакеты (`@nestjs/*`) при этом нужно добавлять в чёрный список отдельно. Не используйте общую маску `@*/*`: она заодно ловит алиасы вида `@core/Orders`.

Разделение на корни стоит своих затрат, когда ядро действительно нужно запускать без сервера: из CLI, из воркера, из тестов. Если ядро и сервер всегда живут вместе, достаточно шагов 1 и 2.

#### Подключаемые реализации: регистрация в `app`

Когда у ядра много однотипных реализаций (несколько агентов, провайдеров, форматов), ядро не должно называть ни одну из них. В Projector общее ядро чата `modules/agent` содержит только контракт и реестр, а каждый агент — подмодуль сквозного контейнера `modules/agents`. Знает обо всех только `app`:

<FileTree>
  <FileTreeNode name="server" type="folder">
    <FileTreeNode name="app" type="folder" bold>
      <FileTreeNode name="agents.ts" type="file" comment="registerBuiltinAgents" />
    </FileTreeNode>
    <FileTreeNode name="modules" type="folder" bold>
      <FileTreeNode name="agent" type="folder" comment="контракт AgentBackend и реестр">
        <FileTreeNode name="index.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="agents" type="folder" comment="transitModules: ['agents']">
        <FileTreeNode name="codex" type="folder"><FileTreeNode name="index.ts" type="file" /></FileTreeNode>
        <FileTreeNode name="cursor" type="folder"><FileTreeNode name="index.ts" type="file" /></FileTreeNode>
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

```ts
// server/modules/agent/index.ts
export interface AgentBackend { id: string; run(prompt: string): Promise<string> }

const backends = new Map<string, AgentBackend>()
export const registerAgentBackend = (b: AgentBackend) => void backends.set(b.id, b)
```

```ts
// server/app/agents.ts
import { registerAgentBackend } from '../modules/agent'
import { codexBackend } from '../modules/agents/codex'
import { cursorBackend } from '../modules/agents/cursor'

export function registerBuiltinAgents() {
  registerAgentBackend(codexBackend)
  registerAgentBackend(cursorBackend)
}
```

Чтобы добавить агента, достаточно подмодуля и строки в `app`. Со стороны линтера (`transitModules: ["agents"]`, `cycles.modules: true`) это даёт три гарантии, проверенные на пробном проекте:

```text
server/modules/agents/cursor/leak.ts   transit submodules can only be imported via public API   feod-structure/layer-imports
server/app/agents.ts                   module dependency cycle: agent -> agents -> agent        feod-structure/no-module-cycles
```

- Агент не может взять приватный файл соседнего агента.
- Если ядро чата начнёт импортировать конкретного агента, это будет циклом `agent -> agents -> agent`, потому что агент зависит от контракта ядра. Без `cycles.modules` такое нарушение слои не заметят.
- Сообщение о цикле привязано к первому файлу цикла (здесь `app/agents.ts`), а не к строке с лишним импортом. Искать нужно в том месте, где ядро начало знать об агентах.

Реестр в примере — модульное состояние. На сервере с горячей перезагрузкой его приходится делать устойчивым к повторной загрузке модуля; Projector хранит такое состояние в `globalThis`. Это забота реализации, линтер её не проверяет.

Второй приём оттуда же: возможности реализации публикуются данными (`capabilities`), а интерфейс опирается на них, а не на сравнение имени агента. Так ядру и клиенту не нужны условия вида «если это Codex».

### Шаг 4. Порты как контракт

Линтер не требует портов, но структура ядра с портами проверяется естественным образом: если модуль нуждается во внешнем мире, он может получить его только через параметры, потому что импортировать платформу ему запрещено.

Рекомендуемая форма:

```ts
// core/modules/Orders/index.ts
export interface Clock { now(): Date }
export interface OrderStore {
  save(order: Order): Promise<void>
  find(id: string): Promise<Order | null>
}

export interface Order { id: string; total: number; createdAt: Date }

export interface OrdersDeps { store: OrderStore; clock: Clock; newId(): string }

export function createOrders({ store, clock, newId }: OrdersDeps) {
  return {
    async place(total: number): Promise<Order> {
      if (total <= 0) throw new Error('total must be positive')
      const order = { id: newId(), total, createdAt: clock.now() }
      await store.save(order)
      return order
    },
  }
}
```

Что здесь делает ядро чистым:

- Время, генерация идентификаторов, хранилище и очередь — это порты. Любой источник недетерминизма приходит снаружи, и тест подменяет его одной строкой.
- Модуль возвращает значения и бросает ошибки предметной области. Он не знает про статус-коды, заголовки и формат ответа: это работа маршрута.
- Порты описываются в терминах предметной области (`OrderStore.save`), а не технологии (`runQuery`).

Реализации лежат в `server/adapters`, а собирает их `app`. Ядро тестируется без сервера, базы и моков фреймворка: достаточно in-memory реализации порта.

### Шаг 5. Где проходит граница ответственности

Роль слоёв при такой структуре выстраивается так:

| Что | Где | Почему |
| --- | --- | --- |
| Правила предметной области, порты | `modules` ядра | не зависят от окружения |
| Преобразование запроса в вызов, ответа в HTTP | `routes` | знает транспорт, но не знает хранилище |
| Аутентификация, лимиты, логирование запросов | `middlewares` | сквозные заботы транспорта |
| Реализации портов, клиенты БД, очередей, часов | `adapters` | единственное место, где разрешена платформа |
| Конфигурация, подключение зависимостей | `app` | единая точка сборки |
| Нейтральные функции без бизнес-смысла | `common` | перевалочный пункт, не свалка |

Маршрут остаётся тонким: он валидирует вход, вызывает метод модуля и переводит результат в ответ. Валидацию формы запроса удобно держать в маршруте, а инварианты предметной области — в модуле. Так они не дублируют друг друга: маршрут отвечает на вопрос «похоже ли это на запрос», модуль — «допустимо ли это по правилам».

### Шаг 6. Закрыть остальные дыры

Каждая из мер ниже небольшая, но вместе они не дают чистоте деградировать.

**Циклы и приватность.** `cycles.modules` ловит взаимную зависимость модулей, `modules.requirePublicEntry` и `submodules.visibility: "parent-only"` не дают соседям тянуться к чужим внутренностям ([подмодули](/linting/configuration#приватность-публичного-api-подмодуля)). Если два модуля ядра ссылаются друг на друга, связь выносится в порт, а реализацию подставляет `app` ([разбор](/articles/module-links#шаг-3-ioc)).

**Глобальный слой.** Слой `global` не импортируется другими слоями. Чтобы не допустить в нём исполняемого кода и скрытых зависимостей, можно включить:

```js
globals: { allowedFiles: ["**/*.d.ts"], localImports: "type-only" }
```

Тогда там остаются только декларации типов, например расширение `process.env` или `Request`.

**Ограничение размера.** `extra.largeFiles` не даёт модулю ядра раздуться незаметно: файл длиннее порога нужно разбить или внести в реестр с планом ([конфигурация](/linting/configuration#реестр-больших-фаилов-extra-largefiles)).

**Однофайловые модули.** Для маленьких сквозных заботы вроде логгера подходит `singleFileModules: true`: файл `modules/logger.ts` сам является публичным входом.

**Сквозные модули.** Если у одной технологии несколько реализаций (например, `queue/memory` и `queue/sqs`), их можно оформить сквозным модулем с приватным ядром `_` ([описание](/structure/modules#сквозные-модули)).

## Чего линтер не видит

Все проверки выше работают с импортами и статическими строками. Чистоту ядра они гарантируют только по этим каналам. Остаются обходные пути:

- **Глобальные объекты.** `process.env`, `fetch`, `Date.now()`, `Math.random()`, `setTimeout` не требуют импорта. `confine` их не видит. Закрыть это можно обычными средствами ESLint (`no-restricted-globals`, `no-restricted-properties`) для файлов ядра, но это уже настройка вне FEOD.
- **Вычисляемые строки.** Путь, собранный в рантайме, и динамические `import()` с переменными `confine` не проверяет. Именно поэтому `imports.computed: "forbid"` включают вместе с ним.
- **Утечка через типы.** Если порт возвращает `Pool` или `Request`, контракт ядра зависит от платформы, даже когда импортов нет (например, тип получен через `ReturnType` адаптера). В ядре не включайте `allowTypeImports` и смотрите на сигнатуры портов при ревью.
- **Реализует ли адаптер порт.** Это проверяет компилятор, а не линтер: сигнатура `UserStore` должна совпасть с тем, что возвращает адаптер.
- **Граница транзакции.** FEOD не говорит, где она проходит: в модуле, в порте или в маршруте. Пока это решение команды.
- **Отдельные пакеты.** Если платформа запрещена через `confine`, а ядро всё же нужно отдавать как независимый npm-пакет, зависимости в `package.json` пакета придётся контролировать отдельно.

## Какую строгость выбрать

| Уровень | Что делаем | Что получаем | Цена |
| --- | --- | --- | --- |
| 0. Пресет | `backendLayers` | модули не знают о маршрутах и фреймворке | чистота держится на договорённости |
| 1. Защитные проверки | циклы, публичные входы, запрет вычисляемых путей | связи видны и не обходятся динамикой | почти нулевая |
| 2. Адаптеры | слой `adapters` + `confine` для платформы | драйверы и ФС доступны только одному слою | один дополнительный слой и список пакетов |
| 3. Ядро в отдельном корне | корень `core` с `libraryLayers` | ядро запускается без сервера и проверяется отдельно | алиасы, публичный API между корнями |
| 4. Ядро как пакет | отдельный пакет со своим `package.json` | независимые версии и публикация | дисциплина зависимостей и релизов |

Для BFF и небольших сервисов хватает уровней 0–1. Для долгоживущего бизнес-ядра, которое должно переживать смену базы, транспорта или фреймворка, имеет смысл начинать с уровня 2 и переходить на 3, когда появляется второй способ запуска (воркер, CLI, другой транспорт).

## Что не решено

Чтобы не додумывать, зафиксируем открытые места.

- **Готового слоя адаптеров нет.** Шаги выше расширяют `backendLayers` вручную. Нужен ли `adapters` в самом наборе и какие у него должны быть направления импортов, не определено.
- **Общий код маршрутов.** Сейчас маршрутам доступны только `modules` и `common`: общий код приходится выносить туда. Нужна ли `routes` возможность импортировать себя, не определено.
- **Роль `routes`.** У `routes` и `middlewares` нет `role`, поэтому проверки страниц (приватные модули с префиксом `_` и их изоляция) к ним не применяются. Для CLI-набора это решено по-другому: слой `commands` получает `role: "pages"`. Нужен ли такой вариант для `routes`, не решено. Раздел [Pages](/structure/pages) называет `routes` возможным именем слоя страниц для бэкенда.
- **Структура внутри модуля.** Линтер не различает «домен» и «приложение» внутри одного модуля. Запретить платформу можно для всего модуля, а вот отдельное правило «`domain/` не импортирует `application/`» сейчас не выразить; для этого приходится выделять подмодули.
- **Сопоставление данных.** Где преобразовывать доменные сущности в ответ и валидировать вход, FEOD не определяет. Выше этим занимается маршрут, но это пример, а не правило.
- **DI на бэкенде.** [Modules](/structure/modules#пример-взаимодействия-через-ioc) допускает, что на сервере DI-контейнер может оказаться хорошим решением. Пример выше обходится передачей зависимостей параметрами; при десятках модулей ручная сборка в `app` разрастается, а готовых рекомендаций по контейнерам нет. В Projector диспетчер `server/app/api.ts` перечисляет около пятидесяти обработчиков маршрутов вручную; это работает, но файл растёт вместе с API.
- **События и фоновые задачи.** Обмен между модулями через события, очереди и воркеры в наборах слоёв не описан.
- **Проверка на практике.** Опыт ограничен одним проектом, Projector: локальный HTTP-сервер без внешней базы, несколько десятков серверных модулей. Нагруженные сервисы с БД, очередями и транзакциями не опробованы ([roadmap](/other/roadmap)). Приёмы из Projector разобраны в статьях [Одно ядро для нескольких приложений](/articles/shared-core) и [Проверка границ в ежедневной работе](/articles/daily-checks).

Если у вас есть опыт применения FEOD на сервере, он поможет закрыть эти пункты.
