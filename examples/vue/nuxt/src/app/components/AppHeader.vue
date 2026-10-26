<script setup lang="ts">
import { CartWidget } from '@/modules/Cart'
import { UserWidget } from '@/modules/User'

const navigationItems = [
  { name: 'Главная', path: '/' },
  { name: 'Каталог', path: '/catalog' },
  { name: 'Корзина', path: '/cart' },
  { name: 'Профиль', path: '/profile' },
  { name: 'О проекте', path: '/about' }
]
</script>

<template>
  <header class="app-header">
    <div class="app-header__container">
      <NuxtLink
        to="/"
        class="app-header__logo"
      >
        FEOD Shop
      </NuxtLink>
      <nav
        class="app-header__nav"
        aria-label="Основная навигация"
      >
        <ul class="app-header__nav-list">
          <li
            v-for="item in navigationItems"
            :key="item.path"
          >
            <NuxtLink
              :to="item.path"
              class="app-header__nav-link"
            >
              {{ item.name }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="app-header__widgets">
        <CartWidget />
        <UserWidget />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .1);
  padding: 16px 0;

  &__container { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 32px; }
  &__logo { flex-shrink: 0; color: #333; font-size: 24px; font-weight: bold; text-decoration: none; }
  &__nav { flex: 1; }
  &__nav-list { display: flex; flex-wrap: wrap; gap: 8px 18px; list-style: none; margin: 0; padding: 0; }
  &__nav-link { color: #333; font-weight: 500; text-decoration: none; }
  &__nav-link:hover { color: #666; }
  &__widgets { display: flex; align-items: center; gap: 8px; }
}

@media (max-width: 700px) {
  .app-header__container { flex-wrap: wrap; gap: 12px; }
  .app-header__nav { order: 3; flex-basis: 100%; }
  .app-header__widgets { margin-left: auto; }
}
</style>
