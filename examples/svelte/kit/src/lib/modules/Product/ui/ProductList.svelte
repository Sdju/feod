<script lang="ts">
  import type { Product } from '../types'
  import ProductCard from './ProductCard.svelte'

  let { products }: { products: Product[] } = $props()
</script>

<section>
  <h1>Каталог продуктов</h1>
  <div class="product-list">
    {#each products as product (product.id)}
      <ProductCard {product} />
    {/each}
  </div>
</section>
