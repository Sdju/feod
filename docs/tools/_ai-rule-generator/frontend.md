```text
---
rule: for frontend project structure
name: FEOD
purpose: methodology for frontend project structure
dictionary:
  entity: file or directory with specific rules
  level: group of entities on one level of the file system with same entity rules
  public api: index.ts of module
  in-level import: importing from the same level
  cross-level import: importing from different level
  inner level: level inside another level
  parent level: level that contains current level
---
# known level hierarchy

global
common
modules
  modules # called submodules
  pages # called module pages
pages
  modules # called private page module
app

every level has own rules and specific entities
every level can have directories/files at any depth and they are still be treated as at same level until they don't have specific rules
specific rules:
- pages/**/_name -> private page module for page with name.vue
- modules/**/name/modules -> submodules for module name
- modules/**/name/pages -> pages for module name
- other cases it's still same level 
For example
  /common/ui/ -> common level
  /modules/user/modules/editor -> editor module level inside user module level (submodule)
  /modules/user/pages -> pages level inside modules level (module pages)
  /pages/_user -> modules level inside pages level (private page module)

# basic rules
## level rules
we have some situations when one level is inside another level:
submodule: rules described below
module pages:
  - module can import own module pages to export them via public api
private page module:
  - can't import other entities inside page level
  - can't have own pages
  - public api can be used only by page that owns it

## rules ranking
user rules beats level rules
level rules beats basic rules

## import rules
npm packages can be imported anywhere
cross-level import
  MUST follow matrix:
    common can be imported by any level
    modules can be imported by pages and app (only via public api)
    pages can be imported only by app
    app can't be imported
barrel/index files
  index.ts allowed only for module public api
  ❌ for other cases. It's intended rule don't break it! Use direct import instead
cross-module import rules:
for module graph
A
  B
    C
  D

only correct cross-module import by graph:
module can import submodules: A -> B / D, B -> C
module can import sibling modules: B <-> D
module can import module form level below: C -> D
cross-module import MUST use public api of module!
exception for rule:: 
  module can import parent module enties without public api: C -> B, B -> A
  Otherwise it will cause circular dependency! Try to avoid import from parent module entities when possible.

relative or absolute paths:
  absolute paths
    should be used only with alias @
    for cross-level import
      ✅ @/common/utils/formatDate
      ❌ ../../utils/formatDate
    for module import
  relative paths: allow for
    in-level import
    in-module import
    submodule import
    import from parent module

## file name rules
kebab-case with special-symbols support for all

# levels
every level has own rules and specific entities.
examples for entities have format:
✅ good entities for level
❌ bad entities for level -> correct place / alternative place (clarification)

## global
entities that MUST be used globally without import like d.ts files etc.
✅ types declarations: ts shims, global types, libraries interface extension (vue-router / vue global components etc.)
✅ extending global objects: polyfills, window/global/globalThis extensions (only if it is really necessary and impossible to do it in other way)
❌ utils -> common / module
❌ importable types -> common / module
❌ global styles -> app styles (because they are more like config for styles not like)

### rules
- imports global level entities
  to enable global entities if it is really necessary and impossible to do it in other way
    ✅ app/init
      for polyfills or hacking some global objects/3rd-party libraries.
  ❌ for other places and scenarios
- to handle .d.ts files they should be included in tsconfig.json

## common
reusable entities without business logic
✅ utils, types, interfaces, enums, constants, etc.
✅ one file entities
❌ complex entities which can be grouped into one module as UI library, API requests, etc. -> module
❌ entity have to use other modules -> module
❌ entity used only in one place (private components, utils, etc.) -> into entity that uses it

you MUST NOT create index/barrel files in common layer!

## modules
grouped business logic, isolated modules with public apiß
✅ ui library, api request library, other entities grouped by specific domain (user module etc.)
✅ when they have to use other modules
❌ modules created only for one page -> private module for page

### rules

- try to minimize amount of cross imports between modules.
  do sumbodules isolated from parent modules
  use submodules when you need to isolate some logic from other modules
  use IoC when possible to avoid cross imports
- if module reads some config to initialize it, it should be done via IoC from app level
- submodules should be used only when you need to isolate some logic from other modules and parent module grows too much

##  pages
### rules
- uses file-based routing as strict name convention (doesn't require to use plugins for them)
- in page level you can have only page files and private page modules
- keep pages as simple as possible. If page grows, split it into modules.

forbidden situation:
- have name.vue and name/index.vue -> prefer name/index.vue
- have index page in group directory -> prefer index page outside group

## app
level for application bootstrap and configuration
✅ application bootstrap, routing config, 3rd-party integrations, app layouts, modules initialization
❌ something which isn't important to bootstrap the app -> module / common

```

### Пример структуры

Часть файлов опущена.

```text
src/
  global/
    vue-router.d.ts # route meta interface declaration
  common/ # can have own directories
    ui/ # just an example common have any directories while it isn't a module-like
      spacer.vue
    utils/
      formatDate.ts
  modules/
    user-profile/
      modules/
        wysiwyg-editor/ # it isn't directly related to user profile but it is used only inside it, so better to keep it inside
      ui/
      router.ts # config to handle pages of module can have url prefix like /user/ for all module pages
      pages/
        index.vue # /user/
        editor.vue # /user/editor
      index.ts # public api of module
  pages/
    index.vue
    home.vue
    (name)/
      _name/
      name.vue
      some_[slug].name.vue
    profile/
      index.vue
      [id].vue
    [...404].vue
  app/
    entry.ts # entry point of app
    app.vue
    router.ts # routing config
    integrations/ # integrations with 3rd-party services
      google.ts # integration with google gtag
    init/ # initialization of modules
      user-profile.ts # initialization of user profile module (passing config to module and init it)
    layouts/
      default.vue
    styles/
      reset.css
      global.css
```
