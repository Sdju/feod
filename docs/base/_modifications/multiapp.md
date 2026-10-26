<FileTree>
  <FileTreeNode name="src" type="folder" comment="корень для исходного кода проекта">
    <FileTreeNode name="apps" type="folder" comment="все приложения проекта">
      <FileTreeNode name="main-site" type="folder" comment="главное приложение проекта">
        <FileTreeNode name="app" type="folder" comment="запуск главного сайта" link="/structure/app" />
        <FileTreeNode name="pages" type="folder" comment="страницы главного сайта" link="/structure/pages" />
        <FileTreeNode name="modules" type="folder" comment="модули главного сайта" link="/structure/modules" />
        <FileTreeNode name="globals" type="folder" optional comment="общие сущности главного сайта" link="/structure/global" />
      </FileTreeNode>
      <FileTreeNode name="commercial-landing" type="both" comment="специфичное приложение для коммерческого лендинга" />
      <FileTreeNode name="electron-app" type="both" comment="основа для приложения на Electron" />
    </FileTreeNode>
    <FileTreeNode name="pages" type="folder" comment="общие переиспользуемые страницы" link="/structure/pages">
      <FileTreeNode name="PageName.tsx" type="file" variant multiple comment="общие переиспользуемые страницы" />
    </FileTreeNode>
    <FileTreeNode name="modules" type="folder" comment="общие переиспользуемые модули" link="/structure/modules">
      <FileTreeNode name="ModuleName" type="folder" variant multiple comment="общий модуль" />
    </FileTreeNode>
    <FileTreeNode name="common" type="folder" comment="общие переиспользуемые части" link="/structure/common" />
    <FileTreeNode name="globals" type="folder" optional comment="общие переиспользуемые сущности" link="/structure/global" />
  </FileTreeNode>
</FileTree>

По сути у нас появляется возможность собирать разные приложения из одного набора модулей или страниц. При этом у каждого приложения могут быть свои приватные модули и страницы. Однако при необходимости они легко могут перемещаться на верхние уровни и становиться общими для всех приложений.

На самом деле может быть уместна и попытка реализовать «глупые» приложения. В этом случае всё сводится к максимально тонкому `app`-уровню, в котором происходит только финальная донастройка приложения и запуск. Этот вариант может подойти, если вам нужно создавать множество крайне схожих приложений из одного набора модулей и страниц.
