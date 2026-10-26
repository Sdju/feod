<script setup lang="ts">
import AppFooter from './_/AppFooter.vue'
import AppHeader from './_/AppHeader.vue'
</script>

<template>
  <div class="layout-default">
    <AppHeader class="layout-default__header" />
    <main class="layout-default__main">
      <div class="layout-default__container">
        <slot />
      </div>
    </main>
    <AppFooter class="layout-default__footer" />
  </div>
</template>

<style scoped lang="scss">
.layout-default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__header {
    flex-shrink: 0;
  }

  &__main {
    flex-grow: 1;
    padding: 20px 0;
  }

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  &__footer {
    flex-shrink: 0;
  }
}
</style>
