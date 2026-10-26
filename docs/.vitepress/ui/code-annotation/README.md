# Code Annotation Components

Компоненты для добавления inline-аннотаций к коду в документации.

## Компоненты

### CodeAnnotation

Inline-компонент для добавления аннотаций в тексте или HTML.

**Использование:**
```vue
<CodeAnnotation marker="ℹ️" position="top">
  Текст пояснения
</CodeAnnotation>
```

**Props:**
- `marker` (string, default: "ℹ️") - иконка/символ маркера
- `position` ('top' | 'bottom' | 'left' | 'right', default: 'top') - позиция tooltip

**Особенности:**
- Tooltip появляется при наведении
- Можно кликнуть для фиксации tooltip
- Подчеркивание при наведении
- Анимация появления/исчезновения

### AnnotatedCode

Wrapper для code blocks с поддержкой аннотаций по номерам строк.

**Использование:**
```vue
<AnnotatedCode :annotations="[
  { line: 3, content: 'Пояснение к строке 3', marker: 'ℹ️' },
  { line: 5, content: 'Пояснение к строке 5', marker: '💡', position: 'bottom' }
]">
  <!-- Ваш code block здесь -->
</AnnotatedCode>
```

**Props:**
- `annotations` (Array<Annotation>) - массив аннотаций
- `lineHeight` (number, default: 24) - высота строки в пикселях

**Annotation interface:**
```ts
interface Annotation {
  line: number        // Номер строки (начиная с 1)
  content: string     // HTML содержимое tooltip
  marker?: string     // Иконка (по умолчанию ℹ️)
  position?: 'top' | 'bottom' | 'left' | 'right'  // Позиция tooltip
}
```

## Популярные паттерны

### VS Code Style
Иконка в конце строки с tooltip при hover - реализовано через `AnnotatedCode`.

### MDN Style
Подчеркивание с tooltip - реализовано через `CodeAnnotation` с подчеркиванием.

### GitHub Style
Inline comments - можно использовать `CodeAnnotation` в комментариях кода.

## Примеры использования

См. файл `docs/examples/code-annotations-example.md` для полных примеров.

