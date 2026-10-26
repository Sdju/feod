# Пример использования аннотаций в коде

Компонент `CodeAnnotation` позволяет добавлять inline-пояснения к коду с tooltip при наведении.

## Базовое использование

В markdown можно использовать компонент напрямую в HTML:

```vue
<!-- @include: ./_code-annotations/basic-usage.vue.md -->
```

## Использование в обычном тексте

Можно использовать в любом месте markdown:

Это важная концепция <CodeAnnotation marker="note">FEOD использует фрактальную структуру модулей, что позволяет создавать вложенные модули без ограничения глубины.</CodeAnnotation> для понимания архитектуры.

## Различные маркеры

- <CodeAnnotation marker="info">Информация</CodeAnnotation>
- <CodeAnnotation marker="warn">Предупреждение</CodeAnnotation>
- <CodeAnnotation marker="tip">Совет</CodeAnnotation>
- <CodeAnnotation marker="❓">Вопрос</CodeAnnotation>
- <CodeAnnotation marker="✓">Проверка</CodeAnnotation>

## Использование в CodeView с аннотациями

Для аннотаций в компоненте `CodeView` используйте prop `annotations` в `CodeViewFile`:

<CodeView>
  <template #sidebar>
    <FileTree>
      <FileTreeNode name="example.ts" type="file" selectable file-id="example.ts" />
    </FileTree>
  </template>

  <CodeViewFile
    name="example.ts"
    path="example.ts"
    language="typescript"
    :annotations="[
      { line: 3, content: 'count хранит исходное состояние; его изменение обновляет doubled.', marker: 'info', position: 'top' },
      { line: 7, content: 'Производное значение вычисляется из count, без отдельного изменяемого состояния.', marker: 'tip', position: 'bottom' }
    ]"
  >

<!-- @include: ./_code-annotations/codeview-example--ts.md -->

  </CodeViewFile>
</CodeView>

## Использование с AnnotatedCode

Для аннотаций в обычных code blocks используйте компонент `AnnotatedCode`:

<AnnotatedCode :annotations="[
  { line: 3, content: 'Единственный источник состояния для счётчика.', marker: 'info' },
  { line: 7, content: 'computed пересчитывает doubled при изменении count.', marker: 'tip', position: 'bottom' }
]">

<!-- @include: ./_code-annotations/annotated-code-example--ts.md -->

</AnnotatedCode>

## Позиционирование tooltip

- `position="top"` - tooltip сверху (по умолчанию)
- `position="bottom"` - tooltip снизу
- `position="left"` - tooltip слева
- `position="right"` - tooltip справа

<CodeAnnotation marker="info" position="top">Tooltip сверху</CodeAnnotation>
<CodeAnnotation marker="info" position="bottom">Tooltip снизу</CodeAnnotation>
<CodeAnnotation marker="info" position="left">Tooltip слева</CodeAnnotation>
<CodeAnnotation marker="info" position="right">Tooltip справа</CodeAnnotation>
