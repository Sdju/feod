<FileTree>
  <FileTreeNode name="app" type="folder" comment="запуск и настройка приложения">
    <FileTreeNode name="assets" type="folder" comment="ассеты для запуска приложения, но не глобальные"/>
    <FileTreeNode name="router.ts" type="file" />
    <FileTreeNode name="config.ts" type="file" />
    <FileTreeNode name="entry.ts" type="file" />
    <FileTreeNode name="integrations" type="folder" comment="настройки интеграций с внешними сервисами">
      <FileTreeNode name="google.ts" type="file" comment="настройки Google Analytics" />
      <FileTreeNode name="growthbook.ts" type="file" comment="настройки GrowthBook" />
    </FileTreeNode>
    <FileTreeNode name="layouts" type="folder">
      <FileTreeNode name="default.vue" type="file" />
      <FileTreeNode name="clear.vue" type="file" comment="лейаут без шапки и подвала" />
    </FileTreeNode>
    <FileTreeNode name="ui" type="folder" comment="UI-компоненты для запуска приложения">
      <FileTreeNode name="layout-parts" type="folder" comment="части лейаута">
        <FileTreeNode name="Header.vue" type="file" />
        <FileTreeNode name="Footer.vue" type="file" />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>
