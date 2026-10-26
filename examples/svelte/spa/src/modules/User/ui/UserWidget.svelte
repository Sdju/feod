<script lang="ts">
  import { useUser } from '../store/context'
  const userStore = useUser()
</script>
<a class="user-widget" href="/profile">
  <img src={userStore.user.avatar} alt="" />
  <span class="user-widget__name">{userStore.user.name}</span>
</a>
