---
title: AI Rule Generator
---

# AI Rule Generator

Генератор правил для AI-ассистентов на основе архитектуры FEOD.

::: warning
Страница пока не работает и требует полной переработки.
:::

## Возможности

- шаблоны инструкций для агентов
- генерация правил для code review
- адаптация под конкретный проект

## Использование

Описание и примеры появятся здесь.

## Базовые примеры FEOD rules

Ниже — статические шаблоны инструкций для AI-агента. Их можно скопировать в правила проекта; работа генератора пока не реализована.

### Frontend

<!-- @include: ./_ai-rule-generator/frontend.md -->

### Backend

Черновой шаблон для серверного проекта; он не является конфигурацией линтера или результатом работающего генератора.

```yaml
title: FEOD (backend)
purpose: Минимальные правила FEOD для BFF и серверов.
layers:
  app: bootstrap, конфигурации, интеграции
  routes: маршруты (file-based routing)
  middlewares: middleware уровня приложения
  modules: бизнес-логика, изолированные модули
  global: сущности без импорта (типы, полифиллы, shim)
imports:
  direction: app -> (routes | middlewares) -> modules
  routes: importable-by [app]
  middlewares: importable-by [app]
  routes-middlewares: no-cross-imports
  global: no-imports
  modules:
    allowed-imports: [modules]
    public-entry: index.ts
    no-deep-imports: true
rules:
  zigzag-imports: disallow
  module-submodules:
    location: modules/<Module>/modules/<Submodule>
    access:
      outside: via parent module public API only
      avoid-from-submodule-to-parent: true
```
