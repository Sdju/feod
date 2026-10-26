<script lang="ts">
  import { ProductDetails, type Product } from '@/modules/Product'

  let { product }: { product: Product } = $props()
</script>

<ProductDetails {product} />
