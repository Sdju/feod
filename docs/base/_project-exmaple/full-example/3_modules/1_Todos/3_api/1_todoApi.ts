import type { CreateTodoDto, Todo } from '../types/todo.types'

export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos')
  if (!response.ok) {
    throw new Error('Failed to fetch todos')
  }
  return response.json()
}

export async function createTodo(dto: CreateTodoDto): Promise<Todo> {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  if (!response.ok) {
    throw new Error('Failed to create todo')
  }
  return response.json()
}

export async function toggleTodo(id: string, completed: boolean): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
  if (!response.ok) {
    throw new Error('Failed to update todo')
  }
  return response.json()
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error('Failed to delete todo')
  }
}
