<template>
  <nav class="todo-filter-bar" aria-label="Фильтр задач">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="todo-filter-bar__button"
      :class="{ 'todo-filter-bar__button--active': modelValue === option.value }"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
      <span class="todo-filter-bar__count">{{ counts[option.value] }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { TodoFilter, TodoFilterCounts } from '../types/todoFilter.types'

defineProps<{
  modelValue: TodoFilter
  counts: TodoFilterCounts
}>()

defineEmits<{
  'update:modelValue': [value: TodoFilter]
}>()

const options = [
  { value: 'all' as const, label: 'Все' },
  { value: 'active' as const, label: 'Активные' },
  { value: 'completed' as const, label: 'Выполненные' },
]
</script>
