<AnnotatedCode :annotations="[
  {
    line: 1,
    content: 'Импорт одного компонента из файла не создаёт общий API для всего common.',
    marker: 'check',
    position: 'top'
  }
]">

```ts
import Button from '@/common/ui/Button.vue'
import { formatDate } from '@/common/utilities/formatDate'
import { useDebounce } from '@/common/composables/useDebounce'

// ❌ Неправильно (индексные файлы запрещены)
import { Button, formatDate, useDebounce } from '@/common'
```

</AnnotatedCode>
