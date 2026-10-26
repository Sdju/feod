<script lang="ts">
  import MainButton from '@/common/ui/MainButton.svelte'
  import { useCart } from '@/modules/Cart'
  import type { Product } from '../types'

  let { product }: { product: Product } = $props()
  const cart = useCart()
  const isInCart = $derived(cart.items.some(item => item.id === product.id))
</script>

<article class="product-card">
  <img src={product.image} alt={product.title} class="product-card__image" />
  <div class="product-card__content">
    <h2>{product.title}</h2>
    <p>{product.description}</p>
    <div class="product-card__footer">
      <strong>{product.price} ₽</strong>
      <MainButton
        variant={isInCart ? 'secondary' : 'primary'}
        disabled={isInCart}
        onclick={() => cart.addItem(product)}
      >{isInCart ? 'В корзине' : 'В корзину'}</MainButton>
    </div>
  </div>
</article>
