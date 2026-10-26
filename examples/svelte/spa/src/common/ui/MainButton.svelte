<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'

  type Props = Omit<HTMLButtonAttributes, 'class'> & {
    variant?: 'primary' | 'secondary' | 'danger'
    size?: 'small' | 'medium' | 'large'
    children: Snippet
  }

  let { variant = 'primary', size = 'medium', children, ...rest }: Props = $props()
</script>

<button {...rest} class="main-button main-button--{variant} main-button--{size}">
  {@render children()}
</button>
