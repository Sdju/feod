import { ref } from 'vue'
import type { CreateTodoDto, Todo } from '../types/todo.types'
import { createTodo, deleteTodo, fetchTodos, toggleTodo as toggleTodoApi } from '../api/todoApi'

export function useTodos() {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadTodos() {
    loading.value = true
    error.value = null
    try {
      todos.value = await fetchTodos()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function addTodo(dto: CreateTodoDto) {
    const todo = await createTodo(dto)
    todos.value.unshift(todo)
    return todo
  }

  async function toggleTodo(id: string) {
    const todo = todos.value.find((item) => item.id === id)
    if (!todo) return

    const updated = await toggleTodoApi(id, !todo.completed)
    todo.completed = updated.completed
  }

  async function removeTodo(id: string) {
    await deleteTodo(id)
    todos.value = todos.value.filter((item) => item.id !== id)
  }

  return {
    todos,
    loading,
    error,
    loadTodos,
    addTodo,
    toggleTodo,
    removeTodo,
  }
}
