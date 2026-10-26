<script lang="ts">
  import { onMount } from 'svelte'
  import { provideCart } from '@/modules/Cart'
  import { provideUser } from '@/modules/User'
  import About from '@/pages/about.svelte'
  import Cart from '@/pages/cart.svelte'
  import Catalog from '@/pages/catalog.svelte'
  import Home from '@/pages/home.svelte'
  import Profile from '@/pages/profile.svelte'
  import Layout from './layout/Layout.svelte'

  const pageTitles: Record<string, string> = {
    '/': 'Главная',
    '/catalog': 'Каталог',
    '/cart': 'Корзина',
    '/profile': 'Профиль',
    '/about': 'О проекте',
  }

  provideCart()
  provideUser()

  let path = $state('/')
  let title = $derived(pageTitles[path] ?? 'Страница не найдена')

  onMount(() => {
    const updateRoute = () => {
      path = location.pathname
      document.title = `${pageTitles[path] ?? 'Страница не найдена'} - FEOD Shop`
    }

    updateRoute()
    addEventListener('popstate', updateRoute)

    const handleNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || !(event.target instanceof Element)
      ) {
        return
      }

      const link = event.target.closest('a[href^="/"]')
      if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute('download')) {
        return
      }

      event.preventDefault()
      history.pushState({}, '', link.getAttribute('href'))
      updateRoute()
    }

    document.addEventListener('click', handleNavigation)
    return () => {
      removeEventListener('popstate', updateRoute)
      document.removeEventListener('click', handleNavigation)
    }
  })
</script>

<svelte:head><title>{title} - FEOD Shop</title></svelte:head>

<Layout>
  {#if path === '/'}
    <Home />
  {:else if path === '/catalog'}
    <Catalog />
  {:else if path === '/cart'}
    <Cart />
  {:else if path === '/profile'}
    <Profile />
  {:else if path === '/about'}
    <About />
  {:else}
    <section>
      <h1>Страница не найдена</h1>
      <a href="/">На главную</a>
    </section>
  {/if}
</Layout>
