<script lang="ts">
  import MainButton from '@/common/ui/MainButton.svelte'
  import { useCart } from '../store/context'
  import CartItem from './CartItem.svelte'

  const cart = useCart()
</script>

<section>
  <h1>Корзина</h1>
  {#if cart.items.length}
    <ul class="cart-items">
      {#each cart.items as item (item.id)}
        <CartItem
          {item}
          onQuantity={quantity => cart.updateQuantity(item.id, quantity)}
          onRemove={() => cart.removeItem(item.id)}
        />
      {/each}
    </ul>
    <div class="cart-summary">
      <strong class="cart-summary__total">Итого: {cart.totalAmount} ₽</strong>
      <MainButton size="large" onclick={() => cart.clearCart()}>Оформить заказ</MainButton>
      <MainButton variant="secondary" onclick={() => cart.clearCart()}>Очистить корзину</MainButton>
    </div>
  {:else}
    <p>Ваша корзина пуста</p>
  {/if}
</section>
