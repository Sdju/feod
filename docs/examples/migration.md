::: warning
Эта статья сгенерирована AI и требует ручной доработки.
:::

# Переход на FEOD

Если вы решили перейти на FEOD в существующем проекте, рекомендуется делать это постепенно. В этом разделе мы рассмотрим пошаговый процесс миграции.

Для контроля архитектуры во время переноса подключите линтер: в руководстве
[по постепенной миграции](/linting/migration) описаны legacy-слои, исключения
и включение проверок частями.

## Пошаговый план миграции

### Шаг 1: Выделение App

Начните с выделения **app** для входной точки приложения. Соберите всё, что относится к запуску и настройке приложения:

- Роутер
- Конфигурации
- Интеграции с внешними сервисами
- Лейауты
- Точки входа (entry.ts, main.ts)

**До:**
<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="router" type="folder" />
    <FileTreeNode name="config" type="folder" />
    <FileTreeNode name="main.ts" type="file" />
    <FileTreeNode name="App.vue" type="file" />
  </FileTreeNode>
</FileTree>

**После:**
<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="app" type="folder">
      <FileTreeNode name="router" type="folder" />
      <FileTreeNode name="config" type="folder" />
      <FileTreeNode name="entry.ts" type="file" />
      <FileTreeNode name="App.vue" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

### Шаг 2: Определение Pages

Определите и структурируйте **pages**. Соберите все страницы приложения и организуйте их по файловой структуре, соответствующей роутингу.

**До:**
<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="views" type="folder">
      <FileTreeNode name="Home.vue" type="file" />
      <FileTreeNode name="About.vue" type="file" />
      <FileTreeNode name="Login.vue" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

**После:**
<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="pages" type="folder">
      <FileTreeNode name="home.vue" type="file" />
      <FileTreeNode name="about.vue" type="file" />
      <FileTreeNode name="login.vue" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

### Шаг 3: Выделение Common

Выделите **common** для общих утилит и компонентов. Переместите всё, что используется в разных частях приложения и не привязано к конкретной бизнес-логике.

**До:**
<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="components" type="folder">
      <FileTreeNode name="Button.vue" type="file" />
      <FileTreeNode name="Input.vue" type="file" />
    </FileTreeNode>
    <FileTreeNode name="utils" type="folder">
      <FileTreeNode name="clamp.ts" type="file" />
      <FileTreeNode name="formatDate.ts" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

**После:**
<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="common" type="folder">
      <FileTreeNode name="ui" type="folder">
        <FileTreeNode name="Button.vue" type="file" />
        <FileTreeNode name="Input.vue" type="file" />
      </FileTreeNode>
      <FileTreeNode name="utilities" type="folder">
        <FileTreeNode name="clamp.ts" type="file" />
        <FileTreeNode name="formatDate.ts" type="file" />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

### Шаг 4: Постепенное выделение модулей

Постепенно выделяйте модули из оставшегося кода. Начните с наиболее изолированных функциональных областей.

**Пример:**

**До:**

<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="components" type="folder">
      <FileTreeNode name="Auth" type="folder">
        <FileTreeNode name="LoginForm.vue" type="file" />
        <FileTreeNode name="RegisterForm.vue" type="file" />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="store" type="folder">
      <FileTreeNode name="auth.js" type="file" />
    </FileTreeNode>
    <FileTreeNode name="api" type="folder">
      <FileTreeNode name="auth.js" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

**После:**

<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="modules" type="folder">
      <FileTreeNode name="Auth" type="folder">
        <FileTreeNode name="components" type="folder">
          <FileTreeNode name="LoginForm.vue" type="file" />
          <FileTreeNode name="RegisterForm.vue" type="file" />
        </FileTreeNode>
        <FileTreeNode name="store" type="folder">
          <FileTreeNode name="auth.js" type="file" />
        </FileTreeNode>
        <FileTreeNode name="api" type="folder">
          <FileTreeNode name="auth.js" type="file" />
        </FileTreeNode>
        <FileTreeNode name="index.ts" type="file" bold />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

### Шаг 5: Создайте Global

Если в проекте есть глобальные определения типов, полифиллы или расширения интерфейсов, создайте уровень **global**.

**Пример:**
<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="globals" type="folder">
      <FileTreeNode name="vue-extensions.d.ts" type="file" />
      <FileTreeNode name="polyfills.ts" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

## Пример полной миграции

Рассмотрим пример миграции небольшого приложения для управления задачами (Todo App).

### Исходная структура

<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="components" type="folder">
      <FileTreeNode name="TodoList.vue" type="file" />
      <FileTreeNode name="TodoItem.vue" type="file" />
      <FileTreeNode name="TodoForm.vue" type="file" />
      <FileTreeNode name="Button.vue" type="file" />
      <FileTreeNode name="Input.vue" type="file" />
    </FileTreeNode>
    <FileTreeNode name="views" type="folder">
      <FileTreeNode name="Home.vue" type="file" />
      <FileTreeNode name="About.vue" type="file" />
    </FileTreeNode>
    <FileTreeNode name="store" type="folder">
      <FileTreeNode name="todos.js" type="file" />
    </FileTreeNode>
    <FileTreeNode name="router" type="folder">
      <FileTreeNode name="index.js" type="file" />
    </FileTreeNode>
    <FileTreeNode name="utils" type="folder">
      <FileTreeNode name="formatDate.ts" type="file" />
    </FileTreeNode>
    <FileTreeNode name="api" type="folder">
      <FileTreeNode name="todos.js" type="file" />
    </FileTreeNode>
    <FileTreeNode name="App.vue" type="file" />
    <FileTreeNode name="main.js" type="file" />
  </FileTreeNode>
</FileTree>

### Структура после миграции

<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="app" type="folder">
      <FileTreeNode name="router.ts" type="file" />
      <FileTreeNode name="entry.ts" type="file" />
      <FileTreeNode name="App.vue" type="file" />
    </FileTreeNode>
    <FileTreeNode name="pages" type="folder">
      <FileTreeNode name="home.vue" type="file" />
      <FileTreeNode name="about.vue" type="file" />
    </FileTreeNode>
    <FileTreeNode name="modules" type="folder">
      <FileTreeNode name="Todos" type="folder">
        <FileTreeNode name="components" type="folder">
          <FileTreeNode name="TodoList.vue" type="file" />
          <FileTreeNode name="TodoItem.vue" type="file" />
          <FileTreeNode name="TodoForm.vue" type="file" />
        </FileTreeNode>
        <FileTreeNode name="store" type="folder">
          <FileTreeNode name="todos.js" type="file" />
        </FileTreeNode>
        <FileTreeNode name="api" type="folder">
          <FileTreeNode name="todos.js" type="file" />
        </FileTreeNode>
        <FileTreeNode name="index.ts" type="file" bold />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="common" type="folder">
      <FileTreeNode name="ui" type="folder">
        <FileTreeNode name="Button.vue" type="file" />
        <FileTreeNode name="Input.vue" type="file" />
      </FileTreeNode>
      <FileTreeNode name="utilities" type="folder">
        <FileTreeNode name="formatDate.ts" type="file" />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Точка входа `main.js` перенесена в `app/entry.ts`; `index.html` подключает её через `<script type="module" src="/src/app/entry.ts">`.

### Детали миграции

#### 1. Создание модуля Todos

<!-- @include: ./_migration/todos-module-index--ts.md -->

#### 2. Обновление импортов

**До:**

<!-- @include: ./_migration/imports-before--vue.md -->

**После:**

<!-- @include: ./_migration/imports-after--vue.md -->

#### 3. Обновление роутера

**До:**

<!-- @include: ./_migration/router-before--ts.md -->

**После:**

<!-- @include: ./_migration/router-after--ts.md -->

## Рекомендации по миграции

1. **Делайте миграцию постепенно** — не пытайтесь переделать всё сразу
2. **Начните с нового функционала** — применяйте FEOD к новым фичам, постепенно мигрируя старые
3. **Используйте поиск и замену** — автоматизируйте обновление импортов где возможно
4. **Тестируйте после каждого шага** — убедитесь, что приложение работает после каждого изменения
5. **Документируйте процесс** — фиксируйте изменения для команды

## Типичные проблемы при миграции

### Циклические зависимости

**Проблема:** Модули импортируют друг друга напрямую.

**Решение:** Используйте IoC (Inversion of Control) для разрыва циклических зависимостей.

### Слишком большие модули

**Проблема:** Модуль становится слишком большим и содержит несвязанную функциональность.

**Решение:** Разбейте модуль на подмодули или выделите отдельные модули.

### Неясность, куда поместить сущность

**Проблема:** Непонятно, относится ли сущность к common или к модулю.

**Решение:** 
- Если сущность привязана к бизнес-логике → модуль
- Если сущность универсальна и не привязана к бизнесу → common

## Чеклист миграции

- [ ] Выделен уровень app
- [ ] Организованы pages
- [ ] Выделен common
- [ ] Определены основные модули
- [ ] Обновлены все импорты
- [ ] Создан global (если нужен)
- [ ] Обновлена документация
- [ ] Команда обучена новой структуре
