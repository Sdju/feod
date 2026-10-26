<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  type: 'button'
})
</script>

<template>
  <button
    :class="[
      'main-button',
      `main-button--${variant}`,
      `main-button--${size}`,
      { 'main-button--loading': loading }
    ]"
    :type="type"
    :disabled="disabled || loading"
  >
    <span
      v-if="loading"
      class="main-button__loader"
    />
    <span
      class="main-button__content"
      :class="{ 'main-button__content--hidden': loading }"
    >
      <slot />
    </span>
  </button>
</template>

<style scoped lang="scss">
.main-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-width: 100px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: #4CAF50;
    color: white;

    &:hover:not(:disabled) {
      background: #45a049;
    }
  }

  &--secondary {
    background: #f5f5f5;
    color: #333;

    &:hover:not(:disabled) {
      background: #e0e0e0;
    }
  }

  &--danger {
    background: #ff4444;
    color: white;

    &:hover:not(:disabled) {
      background: #ff0000;
    }
  }

  &--small {
    padding: 6px 12px;
    font-size: 14px;
  }

  &--medium {
    padding: 8px 16px;
    font-size: 16px;
  }

  &--large {
    padding: 12px 24px;
    font-size: 18px;
  }

  &__loader {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-right-color: transparent;
    animation: button-loader 0.75s linear infinite;
  }

  &__content {
    opacity: 1;
    transition: opacity 0.2s;

    &--hidden {
      opacity: 0;
    }
  }
}

@keyframes button-loader {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
