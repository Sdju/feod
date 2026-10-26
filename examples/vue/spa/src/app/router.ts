import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: () => import('@/pages/index.vue'),
      meta: {
        title: 'Главная'
      }
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('@/pages/catalog.vue'),
      meta: {
        title: 'Каталог'
      }
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('@/pages/cart.vue'),
      meta: {
        title: 'Корзина'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/profile.vue'),
      meta: {
        title: 'Профиль'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/pages/about.vue'),
      meta: {
        title: 'О проекте'
      }
    }
  ]
})

// Обновление заголовка страницы
router.beforeEach((to, _from, next) => {
  const metaTitle = typeof to.meta.title === 'string' ? to.meta.title : 'FEOD Shop'
  document.title = metaTitle === 'FEOD Shop' ? metaTitle : `${metaTitle} - FEOD Shop`
  next()
})

export default router
