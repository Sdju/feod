<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { CartWidget } from '@/modules/Cart'
import { UserWidget } from '@/modules/User'

const navigationItems = [
  { name: 'Главная', path: '/' },
  { name: 'Каталог', path: '/catalog' },
  { name: 'О проекте', path: '/about' }
]
</script>

<template>
  <header class="app-header">
    <div class="app-header__container">
      <RouterLink
        to="/"
        class="app-header__logo"
      >
        FEOD Shop
      </RouterLink>

      <nav class="app-header__nav">
        <ul class="app-header__nav-list">
          <li
            v-for="item in navigationItems"
            :key="item.path"
            class="app-header__nav-item"
          >
            <RouterLink
              :to="item.path"
              class="app-header__nav-link"
            >
              {{ item.name }}
            </RouterLink>
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
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px 0;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 40px;
  }

  &__logo {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    text-decoration: none;
    flex-shrink: 0;
  }

  &__nav {
    flex-grow: 1;
  }

  &__nav-list {
    display: flex;
    gap: 20px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__nav-link {
    color: #333;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: #666;
    }
  }

  &__widgets {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

@media (max-width: 700px) {
  .app-header {
    &__container {
      flex-wrap: wrap;
      gap: 16px;
    }

    &__nav {
      order: 3;
      flex-basis: 100%;
    }

    &__widgets {
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}
</style>
