import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from '../modules/Auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
  ],
})
