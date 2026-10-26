<FileTree>
  <FileTreeNode name="modules" type="folder">
    <FileTreeNode name="UserManagement" type="folder">
      <FileTreeNode name="domain" type="folder">
        <FileTreeNode name="entities" type="folder">
          <FileTreeNode name="User.ts" type="file" comment="правило изменения email" />
        </FileTreeNode>
      </FileTreeNode>
      <FileTreeNode name="adapters" type="folder">
        <FileTreeNode name="secondary" type="folder">
          <FileTreeNode name="api" type="folder">
            <FileTreeNode name="userApi.ts" type="file" comment="HTTP DTO → User" />
          </FileTreeNode>
        </FileTreeNode>
      </FileTreeNode>
      <FileTreeNode name="index.ts" type="file" bold />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

Ниже показана загрузка пользователя: адаптер преобразует ответ API в сущность. Остальные части модуля здесь опущены.
