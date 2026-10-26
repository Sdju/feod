import { onMounted, ref, watch, type Ref } from 'vue'

// JSON-совместимые значения; сервер и первый клиентский render используют defaultValue.
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const value = ref(defaultValue) as Ref<T>
  const error = ref<string | null>(null)

  onMounted(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) value.value = JSON.parse(stored)
    } catch {
      error.value = 'Не удалось прочитать сохранённое значение'
    }

    watch(value, (next) => {
      try {
        localStorage.setItem(key, JSON.stringify(next))
        error.value = null
      } catch {
        error.value = 'Не удалось сохранить значение'
      }
    }, { deep: true })
  })

  return { value, error }
}
