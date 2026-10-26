```ts
// modules/UserManagement/modules/UserProfile/index.ts
export { default as ProfileForm } from './components/ProfileForm.vue'
```

```ts
// modules/UserManagement/index.ts
export { ProfileForm } from './modules/UserProfile'
```
