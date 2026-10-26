<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <h1>Главная</h1>
  <nav>
    <RouterLink to="/products">Каталог</RouterLink>
    <RouterLink to="/profile">Профиль</RouterLink>
  </nav>
</template>
