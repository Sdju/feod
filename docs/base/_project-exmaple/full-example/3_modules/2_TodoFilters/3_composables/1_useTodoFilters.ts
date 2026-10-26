import { ref } from 'vue'
import type { Todo } from '@/modules/Todos'
import type { TodoFilter, TodoFilterCounts } from '../types/todoFilter.types'

export function useTodoFilters(initialFilter: TodoFilter = 'all') {
  const filter = ref<TodoFilter>(initialFilter)

  function setFilter(value: TodoFilter) {
    filter.value = value
  }

  function filterTodos(todos: Todo[]) {
    if (filter.value === 'active') {
      return todos.filter((todo) => !todo.completed)
    }
    if (filter.value === 'completed') {
      return todos.filter((todo) => todo.completed)
    }
    return todos
  }

  function countByStatus(todos: Todo[]): TodoFilterCounts {
    const completed = todos.filter((todo) => todo.completed).length
    return {
      all: todos.length,
      active: todos.length - completed,
      completed,
    }
  }

  return {
    filter,
    setFilter,
    filterTodos,
    countByStatus,
  }
}
