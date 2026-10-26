<script lang="ts">
  import MainButton from '@/common/ui/MainButton.svelte'
  import { useCart } from '@/modules/Cart'
  import type { Product } from '../types'

  let { product }: { product: Product } = $props()
  const cart = useCart()
  const isInCart = $derived(cart.items.some(item => item.id === product.id))
</script>

<MainButton
  variant={isInCart ? 'secondary' : 'primary'}
  disabled={isInCart}
  onclick={() => cart.addItem(product)}
>{isInCart ? 'В корзине' : 'В корзину'}</MainButton>
