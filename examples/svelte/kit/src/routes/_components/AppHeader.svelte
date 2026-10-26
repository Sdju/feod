<script lang="ts">
  import { resolve } from '$app/paths'
  import { CartWidget } from '@/modules/Cart'
  import { UserWidget } from '@/modules/User'
</script>
<header class="app-header">
  <a class="app-header__logo" href={resolve('/')}>FEOD Shop</a>
  <nav aria-label="Основная навигация">
    <a href={resolve('/')}>Главная</a>
    <a href={resolve('/catalog')}>Каталог</a>
    <a href={resolve('/about')}>О проекте</a>
  </nav>
  <div class="app-header__widgets">
    <CartWidget />
    <UserWidget />
  </div>
</header>
