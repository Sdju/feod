---
layout: doc
---

# Связанные модули: как разорвать цикл

Кросс-модульное взаимодействие — главная опасность модульной архитектуры: чем больше модулей, тем больше связей, и тем сложнее держать их изолированными ([Modules](/structure/modules#кросс-модульное-взаимодействие)). Эта статья разбирает один сценарий по шагам: два модуля зависят друг от друга, и нужно понять, чем это заменить.

Порядок решений такой же, как в описании уровня `modules`: иерархия, сквозной модуль, IoC, линтер как страховка. Каждый шаг ниже проверен плагином, вывод линтера приведён как есть.

## Настройка для проверки

Циклы по умолчанию не проверяются. Для примеров включены `cycles.modules` и `cycles.files`, остальное по умолчанию ([конфигурация](/linting/configuration#пути-файлов-имена-модулей-и-inventory)):

```js
// eslint.config.js
import { createConfig } from "@o-feod/eslint-structure-plugin";

export default [createConfig({
  modules: { requirePublicEntry: true },
  cycles: { modules: true, files: true },
})];
```

## Исходная ситуация

`Cart` читает пользователя, `User` читает корзину:

```ts
// src/modules/Cart/index.ts
import { user } from '@/modules/User'
export const cart = user
```

```ts
// src/modules/User/index.ts
import { cart } from '@/modules/Cart'
export const user = cart
```

```text
src/modules/Cart/index.ts
  error  FEOD: module dependency cycle: Cart -> User -> Cart  feod-structure/no-module-cycles
  error  FEOD: file dependency cycle: src/modules/Cart/index.ts -> src/modules/User/index.ts -> src/modules/Cart/index.ts  feod-structure/no-file-cycles
```

Правило `layer-imports` здесь молчит: каждый импорт идёт через публичный API, и это разрешённое направление. Цикл находят только отдельные правила, поэтому их стоит включать до того, как связей станет много.

Дальше решение зависит от того, что за связь стоит между модулями.

## Шаг 1. Иерархия

Если один модуль по смыслу часть другого, сделайте его подмодулем. Горизонтальная связь становится вертикальной: направление задаёт вложенность, а снаружи виден только публичный API родителя.

`Cart` и `User` на эту роль не подходят: ни один не является частью другого. Для примера возьмём другую пару: `Invoices` — часть `Billing`.

<FileTree>
  <FileTreeNode name="modules" type="folder">
    <FileTreeNode name="Billing" type="folder" bold>
      <FileTreeNode name="index.ts" type="file" comment="export { createInvoice } from './modules/Invoices'" />
      <FileTreeNode name="modules" type="folder" fractal>
        <FileTreeNode name="Invoices" type="folder" bold>
          <FileTreeNode name="index.ts" type="file" />
          <FileTreeNode name="internal.ts" type="file" />
        </FileTreeNode>
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="Cart" type="folder" bold>
      <FileTreeNode name="index.ts" type="file" comment="import { createInvoice } from '@/modules/Billing'" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Обращение через родителя проходит. Остальное зависит от `submodules.visibility`:

| Импорт из `Cart` | По умолчанию (`public`) | `parent-only` |
| --- | --- | --- |
| `@/modules/Billing` | разрешён | разрешён |
| `@/modules/Billing/modules/Invoices` (публичный API подмодуля) | разрешён | `submodule 'Billing/modules/Invoices' is private to its immediate parent` |
| `@/modules/Billing/modules/Invoices/internal` | `'Cart' can only import public API of 'Billing/modules/Invoices'` | `submodule ... is private to its immediate parent` |

Страница [Modules](/structure/modules#подмодули) говорит, что подмодули не используются вне родителя. Линтер по умолчанию требует этого только для приватных файлов, а публичный API неглубокого подмодуля остаётся доступен соседям. Если нужна строгость, включайте `submodules.visibility: "parent-only"` ([конфигурация](/linting/configuration#приватность-публичного-api-подмодуля)).

Глубокие подмодули закрыты в обоих режимах. Для `Billing/modules/Invoices/modules/Pdf` правило `no-submodule-of-submodule` разрешает импорт только владельцу, непосредственному родителю и ребёнку. Импорт из `Cart` и даже из `Billing` через уровень `Invoices` получает ошибку:

```text
error  FEOD: deep submodules are accessible only within their owner or immediate parent/child  feod-structure/no-submodule-of-submodule
```

Иерархия работает только для связей-деревьев. Если два несвязанных модуля используют третий, вкладывать нечего.

## Шаг 2. Сквозной модуль

Если общий модуль нужен нескольким, но не должен быть публичным, используйте [сквозной модуль](/structure/modules#сквозные-модули): контейнер с приватным ядром `_` и публичными подмодулями-адаптерами.

<FileTree>
  <FileTreeNode name="modules" type="folder">
    <FileTreeNode name="pm" type="folder" bold comment="контейнер, transitModules: ['pm']">
      <FileTreeNode name="_" type="folder" comment="приватное ядро">
        <FileTreeNode name="shared.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="npm" type="folder"><FileTreeNode name="index.ts" type="file" /></FileTreeNode>
      <FileTreeNode name="pnpm" type="folder"><FileTreeNode name="index.ts" type="file" /></FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="Tool" type="folder" bold>
      <FileTreeNode name="index.ts" type="file" comment="import { npm } from '@/modules/pm/npm'" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

С `transitModules: ["pm"]` импорт `@/modules/pm/npm` проходит, а ядро закрыто:

```ts
// src/modules/Tool/bad.ts
import { core } from '@/modules/pm/_/shared'
```

```text
error  FEOD: private core of transit module is restricted to its submodules  feod-structure/layer-imports
```

Без `transitModules` контейнер считается обычным модулем без публичного входа, и линтер сообщает `module 'src/modules/pm' is missing a public entry (index.*)` и `can only import public API of 'pm'`. Контейнер нужно объявить в конфигурации.

## Шаг 3. IoC

Если связь взаимная или идёт «снизу вверх» и иерархией её не выразить, зависимость можно инвертировать: модуль объявляет, что ему нужно, а реализацию подставляет `app`.

```ts
// src/modules/Cart/index.ts
export interface UserLookup {
  currentUserId(): string
}

export function createCart(users: UserLookup) {
  return { owner: () => users.currentUserId() }
}
```

```ts
// src/modules/User/index.ts
export const userService = { currentUserId: () => 'u1' }
```

```ts
// src/app/entry.ts
import { createCart } from '@/modules/Cart'
import { userService } from '@/modules/User'

export const cart = createCart(userService)
```

Линтер на этом примере не выдаёт ничего: `Cart` больше не импортирует `User`, цикла нет. Это и есть цена подхода ([предупреждение на странице Modules](/structure/modules#кросс-модульное-взаимодействие)): связь не исчезла, она переехала из импортов в контракт `UserLookup` и в место сборки. Ни `layer-imports`, ни правила циклов её не видят. Ошибки подстановки находятся типами или в рантайме, а сборка копится в `app`.

Если реализация явно объявляет `implements UserLookup` из чужого модуля, ребро возвращается через type-only импорт. Чтобы такие рёбра учитывались, включите `cycles.types: "include"`; по умолчанию type-only импорты в модульных циклах игнорируются.

По умолчанию IoC не нужен. Используйте его там, где связь действительно мешает.

## Шаг 4. Линтер как страховка

Правила не выбирают решение, они ловят то, что осталось:

| Что произошло | Правило | Включено по умолчанию |
| --- | --- | --- |
| Цикл между модулями | [no-module-cycles](/linting/rules/no-module-cycles) | нет, `cycles.modules` |
| Цикл между файлами, в том числе внутри модуля | [no-file-cycles](/linting/rules/no-file-cycles) | нет, `cycles.files` |
| Импорт приватного файла чужого модуля | [layer-imports](/linting/rules/layer-imports) | да |
| Относительный путь в чужой модуль | [no-zigzag-imports](/linting/rules/no-zigzag-imports) | да |
| Доступ к глубокому подмодулю | [no-submodule-of-submodule](/linting/rules/no-submodule-of-submodule) | да |

## Чего линтер не решит

Он не скажет, что `Invoices` — часть `Billing`, а `Cart` и `User` — отдельные модули. Границу нельзя вычислить правилом. Ориентиры из описания уровня: плотность связей между сущностями и отсутствие бизнес-логики в том, что остаётся снаружи. Решение принимает команда.

## Пример из практики

В Projector большая часть циклов исчезла не из-за IoC, а из-за правильного разделения ответственности. Три разреза, которые описаны в его архитектуре:

- **Модель отдельно от интерфейса.** `project` (тип, хранилище, клиент API, маршрут) и `catalog` (карточка, форма, настройки) разведены. Агент, раннер и интеграции зависят от лёгкой модели, а не от компонентов каталога, поэтому цикл «каталог ↔ агент» пропал. Остаётся односторонняя связь: агент обновляет каталог.
- **Общие запросы — вниз.** Подмодули `workspace` (`git`, `viewers`, `issues`, `tree`) друг от друга не зависят и не зависят от значений родителя. Запросы, которые нужны нескольким из них, вынесены в соседний модуль `workspace-api`, а форматирование времени — в `common`.
- **Реестры вместо условий.** Рабочая область не знает видов вкладок и разделов сайдбара: их регистрируют владельцы через контракт. Так исчез целый класс связей «общий код знает про конкретный вид».

Типы родителя подмодуль читает через `submodules.childImportsParent: "implementation"` вместе с `cycles.types: "include"`, поэтому такой импорт не считается циклом parent → child → parent, а настоящие циклы по значениям остаются ошибками ([настройки](/articles/daily-checks#настройки-которые-окупаются-на-практике)).
