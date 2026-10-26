<FileTree>
  <FileTreeNode name="pages" type="folder">
    <FileTreeNode name="index.vue" type="file" comment="главная страница /" />
    <FileTreeNode name="main" type="folder">
      <FileTreeNode name="home.vue" type="file" comment="страница /main/home" />
      <FileTreeNode name="index.vue" type="file" comment="страница /main/" />
    </FileTreeNode>
    <FileTreeNode name="posts" type="folder">
      <FileTreeNode name="_posts" type="folder" comment="приватный модуль для страниц posts">
        <FileTreeNode name="components" type="folder">
          <FileTreeNode name="PostCard.vue" type="file" />
          <FileTreeNode name="PostList.vue" type="file" />
        </FileTreeNode>
        <FileTreeNode name="api" type="folder">
          <FileTreeNode name="postsApi.ts" type="file" />
        </FileTreeNode>
        <FileTreeNode name="index.ts" type="file" bold comment="API для страниц posts" />
      </FileTreeNode>
      <FileTreeNode name="[id].vue" type="file" comment="страница /posts/:id" />
      <FileTreeNode name="index.vue" type="file" comment="страница /posts/" />
    </FileTreeNode>
    <FileTreeNode name="users" type="folder">
      <FileTreeNode name="[userId]" type="folder">
        <FileTreeNode name="posts" type="folder">
          <FileTreeNode name="[postId].vue" type="file" comment="страница /users/:userId/posts/:postId" />
        </FileTreeNode>
        <FileTreeNode name="index.vue" type="file" comment="страница /users/:userId" />
      </FileTreeNode>
    </FileTreeNode>
    <FileTreeNode name="docs" type="folder">
      <FileTreeNode name="[...path].vue" type="file" comment="catch-all маршрут /docs/*" />
    </FileTreeNode>
    <FileTreeNode name="[...404].vue" type="file" comment="страница 404 для всех несуществующих маршрутов" />
  </FileTreeNode>
</FileTree>
