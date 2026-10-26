<script setup lang="ts">
const principles = [
  {
    title: 'Фрактальность',
    description: 'Модули можно дробить на подмодули без смены правил.'
  },
  {
    title: 'Сущности',
    description: 'Каждый файл имеет роль и ограничения по использованию.'
  },
  {
    title: 'Уровни',
    description: 'Четкие правила импортов между слоями проекта.'
  }
]

useHead({ title: 'О FEOD Shop' })
</script>

<template>
  <section class="about-page">
    <h1 class="about-page__title">
      О FEOD Shop
    </h1>
    <p class="about-page__lead">
      Этот проект демонстрирует структуру FEOD на примере простого интернет-магазина.
    </p>

    <div class="about-page__grid">
      <article
        v-for="item in principles"
        :key="item.title"
        class="about-card"
      >
        <h2 class="about-card__title">
          {{ item.title }}
        </h2>
        <p class="about-card__description">
          {{ item.description }}
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.about-page {
  padding: 20px 0 60px;

  &__title {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 12px;
  }

  &__lead {
    color: #666;
    margin-bottom: 32px;
    font-size: 18px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
  }
}

.about-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &__title {
    margin: 0 0 12px;
    font-size: 20px;
  }

  &__description {
    margin: 0;
    color: #666;
    line-height: 1.5;
  }
}
</style>
