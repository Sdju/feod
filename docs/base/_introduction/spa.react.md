<FileTree>
  <FileTreeNode name="src" type="folder">
    <FileTreeNode name="app" type="folder" link="/structure/app">
      <FileTreeNode name="entry.tsx" type="file" />
      <FileTreeNode name="router.ts" type="file" />
      <FileTreeNode name="layouts" type="folder" />
    </FileTreeNode>
    <FileTreeNode name="pages" type="folder" link="/structure/pages">
      <FileTreeNode name="index.tsx" type="file" comment="/" />
      <FileTreeNode name="products.tsx" type="file" comment="/products" />
    </FileTreeNode>
    <FileTreeNode name="modules" type="folder" link="/structure/modules">
      <FileTreeNode name="Cart" type="folder">
        <FileTreeNode name="components" type="folder">
          <FileTreeNode name="Cart.tsx" type="file" />
        </FileTreeNode>
        <FileTreeNode name="hooks" type="folder">
          <FileTreeNode name="useCart.ts" type="file" />
        </FileTreeNode>
        <FileTreeNode name="modules" type="folder" fractal comment="подмодули при росте Cart" />
        <FileTreeNode name="index.ts" type="file" bold comment="публичный API Cart" />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="common" type="folder" link="/structure/common">
      <FileTreeNode name="ui" type="folder">
        <FileTreeNode name="Button.tsx" type="file" />
      </FileTreeNode>
      <FileTreeNode name="utilities" type="folder">
        <FileTreeNode name="formatDate.ts" type="file" />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="globals" type="folder" optional link="/structure/global">
      <FileTreeNode name="env.d.ts" type="file" />
    </FileTreeNode>
  </FileTreeNode>
</FileTree>

В `common` нет общего `index.ts`: каждый компонент и утилита импортируются из своего файла.
