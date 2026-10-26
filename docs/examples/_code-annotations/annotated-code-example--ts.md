```ts
import { ref, computed } from 'vue'

const count = ref(0)
function increment() {
  count.value++
}
const doubled = computed(() => count.value * 2)
```
