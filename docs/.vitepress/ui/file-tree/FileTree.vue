<template>
  <div class="file-tree">
    <ul class="file-tree__list">
      <slot />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { fileTreeDepthKey } from './keys'

provide(fileTreeDepthKey, 0)
</script>

<style scoped>
.file-tree {
  padding: 1rem;
}

.file-tree__list {
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: max-content;
}
</style>
