<script lang="ts">
  import { CartWidget } from '@/modules/Cart'
  import { UserWidget } from '@/modules/User'
</script>
<header class="app-header">
  <a class="app-header__logo" href="/">FEOD Shop</a>
  <nav aria-label="Основная навигация">
    <a href="/">Главная</a>
    <a href="/catalog">Каталог</a>
    <a href="/about">О проекте</a>
  </nav>
  <div class="app-header__widgets">
    <CartWidget />
    <UserWidget />
  </div>
</header>
