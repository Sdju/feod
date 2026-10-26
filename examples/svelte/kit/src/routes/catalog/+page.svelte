<script lang="ts">
  import CatalogPage from '@/pages/catalog.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

<svelte:head>
  <title>Каталог - FEOD Shop</title>
</svelte:head>

<CatalogPage products={data.products} />
