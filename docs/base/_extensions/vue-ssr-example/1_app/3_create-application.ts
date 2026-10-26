import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'
import App from './App.vue'

export function createApplication(server = false) {
  const app = createSSRApp(App)
  const pinia = createPinia()
  const router = createRouter({
    history: server ? createMemoryHistory() : createWebHistory(),
    routes: [{ path: '/', component: () => import('@/pages/index.vue') }]
  })
  app.use(pinia)
  app.use(router)
  return { app, router, pinia }
}
