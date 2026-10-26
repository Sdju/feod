<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__container">
      <div class="app-footer__content">
        <div class="app-footer__section">
          <h3 class="app-footer__title">
            О нас
          </h3>
          <p class="app-footer__text">
            FEOD Shop - демонстрационный магазин, построенный по методологии Fractal Entity Oriented Design
          </p>
        </div>

        <div class="app-footer__section">
          <h3 class="app-footer__title">
            Контакты
          </h3>
          <ul class="app-footer__list">
            <li class="app-footer__item">
              Email: info@feodshop.com
            </li>
            <li class="app-footer__item">
              Телефон: +7 (999) 123-45-67
            </li>
          </ul>
        </div>
      </div>

      <div class="app-footer__bottom">
        <p class="app-footer__copyright">
          © {{ currentYear }} FEOD Shop. Все права защищены.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  background-color: #333;
  color: #fff;
  padding: 40px 0 20px;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  &__content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
    margin-bottom: 40px;
  }

  &__title {
    font-size: 18px;
    margin: 0 0 16px;
  }

  &__text {
    margin: 0;
    line-height: 1.5;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 20px;
  }

  &__copyright {
    text-align: center;
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
}
</style>
