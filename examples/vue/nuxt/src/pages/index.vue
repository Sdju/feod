<script setup lang="ts">
import MainButton from '@/common/ui/MainButton.vue'
import placeholder from '@/common/assets/img/placeholder.png'

const features = [
  {
    title: 'Широкий ассортимент',
    description: 'Тысячи товаров на любой вкус',
    image: placeholder
  },
  {
    title: 'Быстрая доставка',
    description: 'Доставляем заказы в кратчайшие сроки',
    image: placeholder
  },
  {
    title: 'Гарантия качества',
    description: 'Только проверенные товары от надежных поставщиков',
    image: placeholder
  }
]

useHead({ title: 'Главная' })
</script>

<template>
  <div class="main-page">
    <section class="hero">
      <div class="hero__content">
        <h1 class="hero__title">
          Добро пожаловать в FEOD Shop
        </h1>
        <p class="hero__description">
          Ваш надежный магазин с широким ассортиментом товаров
        </p>
        <MainButton
          size="large"
          to="/catalog"
        >
          Перейти в каталог
        </MainButton>
      </div>
      <img
        :src="placeholder"
        alt="Hero image"
        class="hero__image"
      >
    </section>

    <section class="features">
      <h2 class="features__title">
        Наши преимущества
      </h2>
      <div class="features__grid">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="feature-card"
        >
          <img
            :src="feature.image"
            :alt="feature.title"
            class="feature-card__image"
          >
          <h3 class="feature-card__title">
            {{ feature.title }}
          </h3>
          <p class="feature-card__description">
            {{ feature.description }}
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.main-page {
  padding: 40px 0;
}

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  margin-bottom: 80px;

  &__content {
    max-width: 600px;
  }

  &__title {
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 24px;
    line-height: 1.2;
  }

  &__description {
    font-size: 20px;
    color: #666;
    margin-bottom: 32px;
  }

  &__image {
    width: 100%;
    height: 400px;
    object-fit: cover;
    border-radius: 8px;
  }
}

.features {
  &__title {
    font-size: 32px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 40px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 32px;
  }
}

.feature-card {
  text-align: center;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }

  &__image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 50%;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  &__description {
    color: #666;
    line-height: 1.5;
  }
}

@media (max-width: 700px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    margin-bottom: 40px;

    &__title {
      font-size: 32px;
    }

    &__image {
      height: 240px;
    }
  }

  .features__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
