<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import MainButton from '@/common/ui/MainButton.vue'
import { useUserStore } from '../store/user'
import type { User } from '../store/user'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const isEditing = ref(false)
const editedProfile = ref<User>({ ...user.value })

function startEditing(): void {
  isEditing.value = true
  editedProfile.value = { ...user.value }
}

function saveProfile(): void {
  userStore.updateProfile(editedProfile.value)
  isEditing.value = false
}

function cancelEditing(): void {
  isEditing.value = false
}
</script>

<template>
  <div class="user-profile">
    <div class="user-profile__header">
      <img
        :src="user.avatar"
        :alt="user.name"
        class="user-profile__avatar"
      >
      <h1 class="user-profile__title">
        {{ isEditing ? 'Редактирование профиля' : 'Профиль' }}
      </h1>
    </div>

    <div class="user-profile__content">
      <form
        v-if="isEditing"
        class="user-profile__form"
        @submit.prevent="saveProfile"
      >
        <div class="form-group">
          <label
            for="profile-name"
            class="form-group__label"
          >Имя</label>
          <input
            id="profile-name"
            v-model="editedProfile.name"
            type="text"
            class="form-group__input"
            required
          >
        </div>

        <div class="form-group">
          <label
            for="profile-email"
            class="form-group__label"
          >Email</label>
          <input
            id="profile-email"
            v-model="editedProfile.email"
            type="email"
            class="form-group__input"
            required
          >
        </div>

        <div class="form-group">
          <label
            for="profile-phone"
            class="form-group__label"
          >Телефон</label>
          <input
            id="profile-phone"
            v-model="editedProfile.phone"
            type="tel"
            class="form-group__input"
          >
        </div>

        <div class="form-group">
          <label
            for="profile-address"
            class="form-group__label"
          >Адрес</label>
          <textarea
            id="profile-address"
            v-model="editedProfile.address"
            class="form-group__textarea"
          />
        </div>

        <div class="user-profile__actions">
          <MainButton type="submit">
            Сохранить
          </MainButton>
          <MainButton
            type="button"
            variant="secondary"
            @click="cancelEditing"
          >
            Отмена
          </MainButton>
        </div>
      </form>

      <div
        v-else
        class="user-profile__info"
      >
        <div class="info-group">
          <span class="info-group__label">Имя</span>
          <span class="info-group__value">{{ user.name }}</span>
        </div>

        <div class="info-group">
          <span class="info-group__label">Email</span>
          <span class="info-group__value">{{ user.email }}</span>
        </div>

        <div class="info-group">
          <span class="info-group__label">Телефон</span>
          <span class="info-group__value">{{ user.phone }}</span>
        </div>

        <div class="info-group">
          <span class="info-group__label">Адрес</span>
          <span class="info-group__value">{{ user.address }}</span>
        </div>

        <div class="user-profile__actions">
          <MainButton @click="startEditing">
            Редактировать
          </MainButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-profile {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 32px;

  &__header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;
  }

  &__avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__title {
    margin: 0;
    font-size: 32px;
    font-weight: bold;
  }

  &__actions {
    display: flex;
    gap: 16px;
    margin-top: 24px;
  }
}

.form-group {
  margin-bottom: 20px;

  &__label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }

  &__input,
  &__textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: #4CAF50;
    }
  }

  &__textarea {
    min-height: 100px;
    resize: vertical;
  }
}

.info-group {
  margin-bottom: 20px;

  &__label {
    display: block;
    color: #666;
    margin-bottom: 4px;
  }

  &__value {
    font-size: 16px;
    font-weight: 500;
  }
}

@media (max-width: 700px) {
  .user-profile {
    padding: 20px;

    &__header {
      flex-wrap: wrap;
      gap: 16px;
    }

    &__title {
      font-size: 28px;
      overflow-wrap: anywhere;
    }

    &__actions {
      flex-wrap: wrap;
    }
  }

  .info-group__value {
    overflow-wrap: anywhere;
  }
}
</style>
