```ts
// modules/Notifications/index.ts
export interface NotificationService {
  show(message: string): void
}

export function createNotifications(service: NotificationService) {
  return { success: (message: string) => service.show(message) }
}
```

```ts
// modules/ToastUI/index.ts
export function createToastService(container: HTMLElement) {
  return {
    show(message: string) {
      const toast = document.createElement('p')
      toast.textContent = message
      container.append(toast)
    }
  }
}
```

```ts
// app/integrations/notifications.ts
import { createNotifications } from '@/modules/Notifications'
import { createToastService } from '@/modules/ToastUI'

const container = document.querySelector<HTMLElement>('#notifications')
if (!container) throw new Error('Нет контейнера уведомлений')
export const notifications = createNotifications(createToastService(container))
notifications.success('Изменения сохранены')
```

Контейнер `#notifications` находится в HTML приложения. На каждый запуск создаётся отдельный сервис; модули не хранят общую изменяемую зависимость.
