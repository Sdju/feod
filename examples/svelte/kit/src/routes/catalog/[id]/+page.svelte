<script lang="ts">
  import ProductPage from '@/pages/catalog/[id].svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

<svelte:head>
  <title>{data.product.title} - FEOD Shop</title>
  <meta name="description" content={data.product.description} />
</svelte:head>

<ProductPage product={data.product} />
