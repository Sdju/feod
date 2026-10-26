import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  srcDir: 'src/app',
  serverDir: 'src/app/server',
  // Страницы Nuxt и есть слой pages FEOD: файловый роутинг совпадает с его моделью по умолчанию.
  dir: { pages: '../pages' },
  alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  app: { head: { title: 'FEOD Shop', titleTemplate: '%s - FEOD Shop' } },
  modules: ['@pinia/nuxt'],
  css: ['~/styles/main.css'],
  devtools: { enabled: false },
})
