<script lang="ts">
  import { products } from '../data'
  import ProductCard from './ProductCard.svelte'
</script>

<section>
  <h1>Каталог продуктов</h1>
  <div class="product-list">
    {#each products as product (product.id)}
      <ProductCard {product} />
    {/each}
  </div>
</section>
