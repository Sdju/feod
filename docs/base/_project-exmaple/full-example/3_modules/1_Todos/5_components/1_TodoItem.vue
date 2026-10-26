<template>
  <li class="todo-item" :class="{ 'todo-item--completed': todo.completed }">
    <label class="todo-item__label">
      <input
        type="checkbox"
        :checked="todo.completed"
        @change="$emit('toggle', todo.id)"
      />
      <span class="todo-item__title">{{ todo.title }}</span>
    </label>
    <time class="todo-item__date">{{ formatDate(todo.createdAt) }}</time>
    <Button variant="danger" @click="$emit('remove', todo.id)">
      Удалить
    </Button>
  </li>
</template>

<script setup lang="ts">
import Button from '@/common/ui/Button.vue'
import { formatDate } from '@/common/utilities/formatDate'
import type { Todo } from '../types/todo.types'

defineProps<{
  todo: Todo
}>()

defineEmits<{
  toggle: [id: string]
  remove: [id: string]
}>()
</script>
