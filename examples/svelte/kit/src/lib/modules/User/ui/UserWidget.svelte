<script lang="ts">
  import { resolve } from '$app/paths'
  import { useUser } from '../store/context'
  const userStore = useUser()
</script>
<a class="user-widget" href={resolve('/profile')}>
  <img src={userStore.user.avatar} alt="" />
  <span class="user-widget__name">{userStore.user.name}</span>
</a>
