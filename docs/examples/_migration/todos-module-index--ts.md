```ts
// modules/Todos/index.ts
export { default as TodoList } from './components/TodoList.vue'
export { useTodosStore } from './store/todos'
```

Публичными остаются только `TodoList` и `useTodosStore`, которые использует страница ниже. TodoItem, TodoForm и HTTP-функции остаются внутри Todos.
