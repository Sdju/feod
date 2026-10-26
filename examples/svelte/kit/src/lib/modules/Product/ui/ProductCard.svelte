<script lang="ts">
  import { resolve } from '$app/paths'
  import type { Product } from '../types'
  import AddToCartButton from './AddToCartButton.svelte'

  let { product }: { product: Product } = $props()
</script>

<article class="product-card">
  <img src={product.image} alt={product.title} class="product-card__image" />
  <div class="product-card__content">
    <h2>
      <a class="product-card__link" href={resolve('/catalog/[id]', { id: String(product.id) })}>{product.title}</a>
    </h2>
    <p>{product.description}</p>
    <div class="product-card__footer">
      <strong>{product.price} ₽</strong>
      <AddToCartButton {product} />
    </div>
  </div>
</article>

<style>
  .product-card__link {
    color: inherit;
    text-decoration: none;
  }

  .product-card__link:hover {
    text-decoration: underline;
  }
</style>
