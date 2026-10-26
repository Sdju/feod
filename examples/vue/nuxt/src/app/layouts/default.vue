<template>
  <div class="app-layout">
    <AppHeader />
    <main class="container app-layout__main">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-layout__main {
  width: 100%;
  flex: 1;
}
</style>
