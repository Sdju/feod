```ts
// modules/UserManagement/domain/entities/User.ts
export class User {
  constructor(readonly id: string, private email: string) {
    this.updateEmail(email)
  }

  updateEmail(email: string): void {
    const normalized = email.trim()
    if (!normalized) throw new Error('Email не может быть пустым')
    this.email = normalized
  }

  getEmail(): string {
    return this.email
  }
}
```
