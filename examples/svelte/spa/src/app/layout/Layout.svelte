<script lang="ts">
  import type { Snippet } from 'svelte'
  import AppFooter from './AppFooter.svelte'
  import AppHeader from './AppHeader.svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="layout">
  <AppHeader />
  <main>{@render children()}</main>
  <AppFooter />
</div>
