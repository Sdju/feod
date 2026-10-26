<script lang="ts">
  import { resolve } from '$app/paths'
  import { useCart } from '../store/context'
  const cart = useCart()
</script>
<a class="cart-widget" href={resolve('/cart')} aria-label="Открыть корзину">
  <span aria-hidden="true">🛒</span>
  {#if cart.itemsCount > 0}<span class="cart-widget__counter">{cart.itemsCount}</span>{/if}
  <span class="cart-widget__total">{cart.totalAmount} ₽</span>
</a>
