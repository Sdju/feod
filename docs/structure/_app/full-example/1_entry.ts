// [comment:"точка входа"]
import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'
import { initGoogleAnalytics } from './integrations/google'

const app = createApp(App)
app.use(router)
initGoogleAnalytics()
app.mount('#app')
