<script lang="ts">
  import type { Snippet } from 'svelte'
  import { provideCart } from '@/modules/Cart'
  import { provideUser } from '@/modules/User'
  import AppFooter from './_components/AppFooter.svelte'
  import AppHeader from './_components/AppHeader.svelte'
  import '@/common/styles/main.css'

  let { children }: { children: Snippet } = $props()

  provideCart()
  provideUser()
</script>

<div class="layout">
  <AppHeader />
  <main>{@render children()}</main>
  <AppFooter />
</div>
