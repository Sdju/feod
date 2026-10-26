<script lang="ts">
  import { ProductList, type Product } from '@/modules/Product'

  let { products }: { products: Product[] } = $props()
</script>

<ProductList {products} />
