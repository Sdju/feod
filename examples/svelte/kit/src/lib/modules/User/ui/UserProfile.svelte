<script lang="ts">
  import MainButton from '@/common/ui/MainButton.svelte'
  import { useUser } from '../store/context'
  import type { User } from '../store/user.svelte'

  const userStore = useUser()
  let editing = $state(false)
  let draft: User = $state({ ...userStore.user })

  function startEditing() {
    draft = { ...userStore.user }
    editing = true
  }

  function save() {
    userStore.updateProfile(draft)
    editing = false
  }

  function cancel() {
    draft = { ...userStore.user }
    editing = false
  }
</script>

<section class="user-profile">
  <header class="user-profile__header">
    <img src={userStore.user.avatar} alt="" />
    <h1>{editing ? 'Редактирование профиля' : 'Профиль'}</h1>
  </header>

  {#if editing}
    <form onsubmit={event => { event.preventDefault(); save() }}>
      <label for="profile-name">Имя</label>
      <input id="profile-name" bind:value={draft.name} required />
      <label for="profile-email">Email</label>
      <input id="profile-email" type="email" bind:value={draft.email} required />
      <label for="profile-phone">Телефон</label>
      <input id="profile-phone" type="tel" bind:value={draft.phone} />
      <label for="profile-address">Адрес</label>
      <textarea id="profile-address" bind:value={draft.address}></textarea>
      <div class="actions">
        <MainButton type="submit">Сохранить</MainButton>
        <MainButton variant="secondary" onclick={cancel}>Отмена</MainButton>
      </div>
    </form>
  {:else}
    <dl class="user-profile__info">
      <dt>Имя</dt><dd>{userStore.user.name}</dd>
      <dt>Email</dt><dd>{userStore.user.email}</dd>
      <dt>Телефон</dt><dd>{userStore.user.phone}</dd>
      <dt>Адрес</dt><dd>{userStore.user.address}</dd>
    </dl>
    <MainButton onclick={startEditing}>Редактировать</MainButton>
  {/if}
</section>
