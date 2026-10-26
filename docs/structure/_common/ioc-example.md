```ts
// common/composables/useNotification.ts
export interface NotificationService {
  show(message: string): void
}

export function useNotification(service: NotificationService) {
  return { notify: (message: string) => service.show(message) }
}
```

Реализацию выбирает `app`; вызов через объект сохраняет `this` сервиса.

```ts
// modules/Notifications/index.ts
export class Notifications {
  constructor(private container: HTMLElement) {}

  show(message: string): void {
    this.container.textContent = message
  }
}
```

```ts
// app/integrations/notifications.ts
import { useNotification } from '@/common/composables/useNotification'
import { Notifications } from '@/modules/Notifications'

const container = document.querySelector<HTMLElement>('#notifications')
if (!container) throw new Error('Нет контейнера уведомлений')
export const { notify } = useNotification(new Notifications(container))
notify('Изменения сохранены')
```

Контейнер `#notifications` находится в HTML приложения. `common` зависит только от интерфейса; app выбирает реализацию из Notifications.
