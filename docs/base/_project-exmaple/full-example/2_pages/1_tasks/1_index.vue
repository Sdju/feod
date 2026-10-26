<template>
  <div class="tasks-page">
    <header class="tasks-page__header">
      <h1>Мои задачи</h1>
      <TodoFilterBar
        :model-value="filter"
        :counts="counts"
        @update:model-value="setFilter"
      />
    </header>
    <form @submit.prevent="submitTodo">
      <label>
        Новая задача
        <input v-model="title" required :disabled="pending" />
      </label>
      <button type="submit" :disabled="pending || !title.trim()">Добавить</button>
    </form>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="actionError" role="alert">{{ actionError }}</p>
    <TodoList
      :todos="filteredTodos"
      :loading="loading"
      @toggle="runAction(() => toggleTodo($event))"
      @remove="runAction(() => removeTodo($event))"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { TodoList, useTodos } from '@/modules/Todos'
import { TodoFilterBar, useTodoFilters } from '@/modules/TodoFilters'

const { todos, loading, error, loadTodos, addTodo, toggleTodo, removeTodo } = useTodos()
const { filter, setFilter, filterTodos, countByStatus } = useTodoFilters()
const title = ref('')
const pending = ref(false)
const actionError = ref<string | null>(null)

const filteredTodos = computed(() => filterTodos(todos.value))
const counts = computed(() => countByStatus(todos.value))

async function runAction(action: () => Promise<unknown>) {
  actionError.value = null
  try {
    await action()
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Не удалось изменить задачу'
  }
}

async function submitTodo() {
  const trimmedTitle = title.value.trim()
  if (!trimmedTitle || pending.value) return
  pending.value = true
  await runAction(async () => {
    await addTodo({ title: trimmedTitle })
    title.value = ''
  })
  pending.value = false
}

onMounted(() => {
  loadTodos()
})
</script>
