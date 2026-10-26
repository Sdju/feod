<FileTree>
  <FileTreeNode name="modules" type="folder">
    <FileTreeNode name="package-manager" type="folder" comment="без промежуточной папки modules">
      <FileTreeNode name="_" type="folder" fractal comment="общее ядро для npm/yarn/pnpm">
        <FileTreeNode name="registry.ts" type="file" />
      </FileTreeNode>
      <FileTreeNode name="npm" type="folder">
        <FileTreeNode name="install.ts" type="file" />
        <FileTreeNode name="index.ts" type="file" bold />
      </FileTreeNode>
      <FileTreeNode name="yarn" type="folder">
        <FileTreeNode name="index.ts" type="file" bold />
      </FileTreeNode>
      <FileTreeNode name="pnpm" type="folder">
        <FileTreeNode name="index.ts" type="file" bold />
      </FileTreeNode>
    </FileTreeNode>
  </FileTreeNode>
</FileTree>
