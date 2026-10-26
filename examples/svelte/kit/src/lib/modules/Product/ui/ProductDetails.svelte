<script lang="ts">
  import { resolve } from '$app/paths'
  import type { Product } from '../types'
  import AddToCartButton from './AddToCartButton.svelte'

  let { product }: { product: Product } = $props()
</script>

<article class="product-details">
  <img src={product.image} alt={product.title} class="product-details__image" />
  <div class="product-details__content">
    <h1>{product.title}</h1>
    <p>{product.description}</p>
    <p class="product-details__price">{product.price} ₽</p>
    <AddToCartButton {product} />
    <a href={resolve('/catalog')}>← Вернуться в каталог</a>
  </div>
</article>

<style>
  .product-details {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 32px;
    align-items: start;
  }

  .product-details__image {
    width: 100%;
    border-radius: 8px;
  }

  .product-details__content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .product-details__price {
    font-size: 24px;
    font-weight: 600;
  }

  @media (max-width: 700px) {
    .product-details {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
