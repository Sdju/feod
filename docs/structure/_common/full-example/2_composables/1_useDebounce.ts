import { onScopeDispose } from 'vue'

export function useDebounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay = 300
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  onScopeDispose(() => clearTimeout(timeoutId))

  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
