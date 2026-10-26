<template>
  <div class="todo-list">
    <div v-if="loading">Загрузка...</div>
    <ul v-else-if="todos.length" class="todo-list__items">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @toggle="$emit('toggle', $event)"
        @remove="$emit('remove', $event)"
      />
    </ul>
    <p v-else class="todo-list__empty">Задач пока нет</p>
  </div>
</template>

<script setup lang="ts">
import type { Todo } from '../types/todo.types'
import TodoItem from './TodoItem.vue'

defineProps<{
  todos: Todo[]
  loading?: boolean
}>()

defineEmits<{
  toggle: [id: string]
  remove: [id: string]
}>()
</script>
