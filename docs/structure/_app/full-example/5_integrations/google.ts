import { googleAnalytics } from '@/modules/analytics'
import { appConfig } from '../app-config'

export function initGoogleAnalytics() {
  if (appConfig.trackingId) googleAnalytics.init(appConfig.trackingId)
}
