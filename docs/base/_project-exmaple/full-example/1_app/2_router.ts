import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from './layouts/default.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'tasks',
          component: () => import('@/pages/tasks/index.vue'),
        },
      ],
    },
  ],
})
