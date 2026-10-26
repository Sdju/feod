<script lang="ts">
  import MainButton from '@/common/ui/MainButton.svelte'
  import type { CartItem as Item } from '../store/cart.svelte'

  let {
    item,
    onQuantity,
    onRemove,
  }: {
    item: Item
    onQuantity: (quantity: number) => void
    onRemove: () => void
  } = $props()
</script>

<li class="cart-item">
  <img src={item.image} alt={item.title} />
  <div class="cart-item__content">
    <h2>{item.title}</h2>
    <p>{item.price} ₽</p>
  </div>
  <div class="cart-item__quantity">
    <MainButton
      variant="secondary"
      size="small"
      aria-label="Уменьшить количество {item.title}"
      onclick={() => onQuantity(item.quantity - 1)}
    >−</MainButton>
    <span>{item.quantity}</span>
    <MainButton
      variant="secondary"
      size="small"
      aria-label="Увеличить количество {item.title}"
      onclick={() => onQuantity(item.quantity + 1)}
    >+</MainButton>
  </div>
  <strong>{item.price * item.quantity} ₽</strong>
  <MainButton variant="danger" size="small" onclick={onRemove}>Удалить</MainButton>
</li>
