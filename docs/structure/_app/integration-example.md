```ts
// modules/Analytics/index.ts
export interface AnalyticsClient {
  track(event: string): void
}

export function createAnalytics(client: AnalyticsClient) {
  return { pageOpened: () => client.track('page_opened') }
}
```

```ts
// app/integrations/analytics.ts
import { createAnalytics } from '@/modules/Analytics'

export const analytics = createAnalytics({
  track(event) {
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
      keepalive: true
    }).catch(() => { /* Телеметрия не блокирует страницу. */ })
  }
})
analytics.pageOpened()
```
