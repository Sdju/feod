import { createApplication } from './create-application'

const { app, router } = createApplication()
await router.isReady()
app.mount('#app')
