<script lang="ts">
  import { resolve } from '$app/paths'
  import { page } from '$app/state'

  const title = $derived(page.status === 404 ? 'Страница не найдена' : 'Что-то пошло не так')
</script>

<svelte:head>
  <title>{title} - FEOD Shop</title>
</svelte:head>

<section>
  <h1>{title}</h1>
  {#if page.status === 404 && page.error?.message && page.error.message !== 'Not Found'}
    <p>{page.error.message}</p>
  {/if}
  <a href={resolve('/')}>На главную</a>
</section>
