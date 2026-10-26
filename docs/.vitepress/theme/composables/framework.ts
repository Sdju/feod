import { computed, ref, watch } from 'vue'
import { inBrowser } from 'vitepress'

type BaseFramework = 'vue' | 'react' | 'angular' | 'svelte'
type RuntimeFramework = 'nuxt' | 'next' | 'sveltekit' | null
type FrameworkId = BaseFramework | 'nuxt' | 'next' | 'sveltekit'

type FrameworkOption = {
  id: FrameworkId
  label: string
  base: BaseFramework
  runtime: RuntimeFramework
}

const STORAGE_KEY = 'feod-framework'
const DEFAULT_FRAMEWORK: FrameworkId = 'vue'

const FRAMEWORKS: FrameworkOption[] = [
  { id: 'vue', label: 'Vue', base: 'vue', runtime: null },
  { id: 'react', label: 'React', base: 'react', runtime: null },
  { id: 'angular', label: 'Angular', base: 'angular', runtime: null },
  { id: 'svelte', label: 'Svelte', base: 'svelte', runtime: null },
  { id: 'nuxt', label: 'Nuxt', base: 'vue', runtime: 'nuxt' },
  { id: 'next', label: 'Next', base: 'react', runtime: 'next' },
  { id: 'sveltekit', label: 'SvelteKit', base: 'svelte', runtime: 'sveltekit' },
]

const FRAMEWORK_IDS = new Set(FRAMEWORKS.map((option) => option.id))
const framework = ref<FrameworkId>(DEFAULT_FRAMEWORK)
const isReady = ref(false)
let watcherStarted = false

const normalizeFramework = (value?: string | null): FrameworkId => {
  if (!value) return DEFAULT_FRAMEWORK
  return FRAMEWORK_IDS.has(value as FrameworkId) ? (value as FrameworkId) : DEFAULT_FRAMEWORK
}

const applyFramework = (value: FrameworkId) => {
  if (!inBrowser) return
  const option = FRAMEWORKS.find((item) => item.id === value) || FRAMEWORKS[0]
  document.documentElement.dataset.framework = option.base
  if (option.runtime) {
    document.documentElement.dataset.runtime = option.runtime
  } else {
    document.documentElement.removeAttribute('data-runtime')
  }
  localStorage.setItem(STORAGE_KEY, value)
}

const initFramework = () => {
  if (!inBrowser || watcherStarted) return
  watcherStarted = true
  framework.value = normalizeFramework(localStorage.getItem(STORAGE_KEY))
  watch(
    framework,
    (value) => {
      applyFramework(value)
      isReady.value = true
    },
    { immediate: true }
  )
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      framework.value = normalizeFramework(event.newValue)
    }
  })
}

export const useFramework = () => {
  initFramework()

  const selected = computed(() => {
    return FRAMEWORKS.find((option) => option.id === framework.value) ?? FRAMEWORKS[0]
  })

  const label = computed(() => selected.value.label)
  const base = computed(() => selected.value.base)
  const runtime = computed(() => selected.value.runtime)

  const setFramework = (value: FrameworkId) => {
    framework.value = normalizeFramework(value)
  }

  return {
    framework,
    frameworks: FRAMEWORKS,
    base,
    runtime,
    label,
    isReady,
    setFramework,
  }
}
