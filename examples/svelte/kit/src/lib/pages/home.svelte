<script lang="ts">
  import { resolve } from '$app/paths'
</script>

<section class="hero">
  <h1>Добро пожаловать в FEOD Shop</h1>
  <p>Ваш надёжный магазин с широким ассортиментом товаров</p>
  <a class="main-button main-button--large" href={resolve('/catalog')}>Перейти в каталог</a>
</section>
<section class="features">
  <h2>Наши преимущества</h2>
  <div class="features__grid">
    <article><h3>Широкий ассортимент</h3><p>Три товара на любой вкус</p></article>
    <article><h3>Быстрая доставка</h3><p>Демонстрационные условия доставки</p></article>
    <article><h3>Гарантия качества</h3><p>Простой пример структуры FEOD</p></article>
  </div>
</section>
