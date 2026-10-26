import { getContext, setContext } from 'svelte'
import { UserStore } from './user.svelte'

const key = Symbol('feod-user')

export function provideUser(): UserStore {
  const store = new UserStore()
  setContext(key, store)
  return store
}

export function useUser(): UserStore {
  const store = getContext<UserStore | undefined>(key)
  if (!store) throw new Error('User provider is missing')
  return store
}
