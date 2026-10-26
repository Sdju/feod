<!-- [comment:"дефолтный лейаут"] -->
<template>
  <div class="default-layout">
    <AppHeader />
    <main>
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../ui/layout-parts/Header.vue'
import AppFooter from '../ui/layout-parts/Footer.vue'
</script>
