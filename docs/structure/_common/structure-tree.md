<FileTree>
  <FileTreeNode name="common" type="folder">
    <FileTreeNode name="ui" type="folder">
      <FileTreeNode name="Button.vue" type="file" />
      <FileTreeNode name="Input.vue" type="file" />
      <FileTreeNode name="index.ts" type="file" forbidden />
    </FileTreeNode>
    <FileTreeNode name="composables" type="folder">
      <FileTreeNode name="useDebounce.ts" type="file" />
      <FileTreeNode name="useLocalStorage.ts" type="file" />
      <FileTreeNode name="index.ts" type="file" forbidden />
    </FileTreeNode>
    <FileTreeNode name="utilities" type="folder">
      <FileTreeNode name="formatDate.ts" type="file" />
      <FileTreeNode name="hasEmailShape.ts" type="file" />
      <FileTreeNode name="index.ts" type="file" forbidden />
    </FileTreeNode>
    <FileTreeNode name="types" type="folder">
      <FileTreeNode name="api.types.ts" type="file" />
      <FileTreeNode name="index.ts" type="file" forbidden />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>


Зачёркнутые `index.ts` показывают запрещённые barrel-файлы. Сущности common импортируются напрямую из своих файлов.
