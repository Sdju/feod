// [comment:"настройки роутера"]
import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from './layouts/default.vue'
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', component: () => import('@/pages/index.vue') },
        { path: 'about', component: () => import('@/pages/about.vue') },
        { path: 'posts/:id', component: () => import('@/pages/posts/[id].vue') },
        { path: 'products', component: () => import('@/pages/products/index.vue') },
        { path: 'products/:id', component: () => import('@/pages/products/[id].vue') },
        { path: 'profile', component: () => import('@/pages/profile/index.vue') },
        { path: ':pathMatch(.*)*', component: () => import('@/pages/[...404].vue') }
      ]
    }
  ]
})
