import { renderToString } from 'vue/server-renderer'
import { createApplication } from '../create-application'

export async function render(url: string) {
  const { app, router } = createApplication(true)
  await router.push(url)
  await router.isReady()
  return renderToString(app)
}
