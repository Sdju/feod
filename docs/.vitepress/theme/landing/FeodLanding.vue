<script setup lang="ts">
const pillars = [
  {
    title: 'Модульность',
    description:
      'Собирайте функциональность в самостоятельные модули и переиспользуйте их как зависимости.',
  },
  {
    title: 'Фрактальность',
    description:
      'Одинаковые правила работают на любой глубине: модуль внутри модуля без потолка по вложенности.',
  },
  {
    title: 'Сущности',
    description:
      'Каждый файл и папка имеют роль и ожидания. Ревью и навигация становятся мгновенными.',
  },
]

const outcomes = [
  {
    title: 'Контроль связности',
    description: 'Четкая цепочка импортов защищает от циклов и случайных зависимостей.',
  },
  {
    title: 'Быстрый онбординг',
    description: 'Новый разработчик читает структуру проекта как карту и быстро включается.',
  },
  {
    title: 'Масштабируемость',
    description: 'Проект растет без пересборки архитектуры и без роста хаоса.',
  },
]

const useCases = [
  'Фронтенд-приложения',
  'Микрофронтенды и монолиты',
  'Платформы с множеством команд',
  'Разработка с использованием AI агентов',
]

const tools = [
  {
    title: 'ESLint plugin',
    description:
      'Правила, которые проверяют импорты и структуру FEOD прямо в редакторе.',
    link: '/tools/eslint-plugin',
    cta: 'Документация',
  },
  {
    title: 'AI rule generator',
    description:
      'Генерируйте правила и шаблоны для AI-ассистентов на основе архитектуры.',
    link: '/tools/ai-rule-generator',
    cta: 'Открыть',
  },
]
</script>

<template>
  <div class="feod-landing">
    <div class="feod-landing__backdrop" aria-hidden="true"></div>

    <section class="feod-landing__hero">
      <div class="feod-landing__island feod-landing__island--hero">
        <div class="feod-landing__hero-split">
          <div class="feod-landing__hero-left">
            <div class="feod-landing__eyebrow">
              <a class="feod-landing__eyebrow-pill" href="/base/">FEOD</a>
              <span>Fractal Entity Oriented Design</span>
            </div>
            <h1 class="feod-landing__title">
              FEOD - Та самая документация к модульному подходу
            </h1>
            <p class="feod-landing__lead">
              FEOD это попытка объяснить то, что витало в воздухе, но не было описано на бумаге.
            </p>
            <div class="feod-landing__actions">
              <a class="feod-button feod-button--primary" href="/base/briefly">
                Начать за 5 минут
              </a>
              <a class="feod-button feod-button--ghost" href="/structure/">
                Смотреть структуру
              </a>
            </div>
          </div>
          <div class="feod-landing__hero-right">
            <div class="feod-landing__hero-right-content">
              <div class="feod-landing__panel-header">
                <a class="feod-landing__panel-title" href="/structure/">Скелет проекта</a>
              </div>
              <FileTree class="feod-landing__file-tree">
                <FileTreeNode name="app" type="folder" bold comment="точка входа и инициализация" />
                <FileTreeNode 
                  name="pages" 
                  type="folder"
                  bold
                  optional
                  fractal
                  fractalComment="подобно URL может иметь вложения"
                  comment="маршруты приложения"
                />
                <FileTreeNode 
                  name="modules" 
                  type="folder" 
                  bold 
                  fractal 
                  fractalComment="модули с поддержкой подмодулей"
                  comment="логика приложения разбитая на модули" 
                />
                <FileTreeNode name="common" type="folder" bold optional comment="общие сущности без бизнес-специфики" />
                <FileTreeNode name="globals" type="folder" bold optional comment="то что доступно без импорта" />
              </FileTree>
              <div class="feod-landing__panel-footer">
                <p class="feod-landing__panel-label">Импорт цепочка</p>
                <p class="feod-landing__panel-value">common → modules → pages → app</p>
                <a class="feod-link feod-link--inline" href="/structure/">Подробнее</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="feod-landing__section">
      <div class="feod-landing__container">
        <div class="feod-landing__section-header">
          <h2><a class="feod-link feod-link--headline" href="/base/">Три опоры FEOD</a></h2>
          <p>
            Методология строится на трех взаимосвязанных принципах: модульность
            формирует границы, фрактальность масштабирует, сущности задают язык.
          </p>
        </div>
        <div class="feod-landing__pillars">
          <div v-for="pillar in pillars" :key="pillar.title" class="feod-card">
            <div class="feod-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <h3 class="feod-card__title">{{ pillar.title }}</h3>
            <p class="feod-card__text">{{ pillar.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="feod-landing__section">
      <div class="feod-landing__container">
        <div class="feod-landing__outcomes">
          <div class="feod-landing__outcomes-text">
            <h2><a class="feod-link feod-link--headline" href="/base/introduction">Что дает FEOD команде</a></h2>
            <p>
              Четкие правила помогают избежать «серых зон» между слоями и распределить
              ответственность.
            </p>
          </div>
          <div class="feod-landing__outcomes-grid">
            <div v-for="outcome in outcomes" :key="outcome.title" class="feod-card feod-card--dark">
              <h3 class="feod-card__title">{{ outcome.title }}</h3>
              <p class="feod-card__text">{{ outcome.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="feod-landing__section">
      <div class="feod-landing__container">
        <div class="feod-landing__cases">
          <div class="feod-landing__case-panel">
            <p class="feod-landing__panel-label">Где FEOD раскрывается</p>
            <ul class="feod-landing__list">
              <li v-for="item in useCases" :key="item" class="feod-landing__list-item">
                <span class="feod-landing__dot"></span>
                {{ item }}
              </li>
            </ul>
            <div class="feod-note feod-note--muted">
              <p class="feod-note__label">Расширения</p>
              <p>FEOD поддерживает SSR-фреймворки, IoC и DDD-подходы без потери ядра методологии.</p>
              <a class="feod-link feod-link--inline" href="/base/extensions">Смотреть расширения</a>
            </div>
          </div>
          <div class="feod-landing__case-text">
            <h2><a class="feod-link feod-link--headline" href="/base/briefly">Легко начать</a></h2>
            <p>
              Богатая документация, гайд по миграции и готовые правила для AI и ESLint
              помогают быстро внедрить FEOD без долгой настройки.
            </p>
            <div class="feod-landing__steps">
              <div class="feod-step">
                <p class="feod-step__label">Шаг 1</p>
                <p>Посмотрите быстрый старт</p>
              </div>
              <div class="feod-step">
                <p class="feod-step__label">Шаг 2</p>
                <p>Изучите гайд по миграции</p>
              </div>
              <div class="feod-step">
                <p class="feod-step__label">Шаг 3</p>
                <p>Подключите AI правила</p>
              </div>
              <div class="feod-step">
                <p class="feod-step__label">Шаг 4</p>
                <p>Включите ESLint plugin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="feod-landing__section">
      <div class="feod-landing__container">
        <div class="feod-landing__section-header">
          <h2>Инструменты экосистемы</h2>
          <p>
            Дополнительные инструменты помогают поддерживать архитектуру и
            ускоряют работу с правилами.
          </p>
        </div>
        <div class="feod-landing__tools">
          <div v-for="tool in tools" :key="tool.title" class="feod-card">
            <h3 class="feod-card__title">{{ tool.title }}</h3>
            <p class="feod-card__text">{{ tool.description }}</p>
            <a class="feod-link" :href="tool.link">{{ tool.cta }}</a>
          </div>
        </div>
      </div>
    </section>

    <section class="feod-landing__cta">
      <div class="feod-landing__island feod-landing__island--cta">
        <div class="feod-landing__cta-inner">
          <h2>Попробуйте FEOD на своем проекте</h2>
          <p>
            Документация охватывает структуру, правила и примеры. Начните с
            короткого введения или сразу посмотрите живые кейсы.
          </p>
          <div class="feod-landing__actions">
            <a class="feod-button feod-button--primary" href="/base/briefly">
              Быстрый старт
            </a>
            <a class="feod-button feod-button--ghost" href="/examples/">
              Примеры
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="feod-landing__footer">
      <div class="feod-landing__island feod-landing__island--footer">
        <p>Open FEOD — архитектура для современной фронтенд-разработки.</p>
        <div class="feod-landing__footer-links">
          <a href="/articles/">Статьи</a>
          <a href="/base/">Основы</a>
          <a href="/structure/">Структура</a>
          <a href="/tools/">Инструменты</a>
          <a href="https://github.com/Sdju/feod" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.feod-landing {
  color: var(--feod-text);
  background: var(--feod-bg);
  padding-bottom: 80px;
  position: relative;
  overflow: hidden;
}

.feod-landing__backdrop {
  position: fixed;
  inset: -20% -10% auto;
  height: 140vh;
  background: radial-gradient(circle at 20% 20%, var(--feod-backdrop-1), transparent 55%),
    radial-gradient(circle at 70% 10%, var(--feod-backdrop-2), transparent 50%),
    radial-gradient(circle at 50% 80%, var(--feod-backdrop-3), transparent 60%);
  filter: blur(10px);
  z-index: 0;
  pointer-events: none;
}

.feod-landing__hero,
.feod-landing__section,
.feod-landing__cta,
.feod-landing__footer {
  position: relative;
  z-index: 1;
}

.feod-landing__hero {
  padding: 28px 16px 0;
}

.feod-landing__island {
  max-width: 1160px;
  margin: 0 auto 28px;
  border-radius: 24px;
  padding: 32px 24px;
  background: var(--feod-surface);
  border: 1px solid var(--feod-border);
  box-shadow: var(--feod-shadow);
}

@media (min-width: 900px) {
  .feod-landing__island {
    padding: 48px 56px;
  }
}

.feod-landing__island--hero {
  background: var(--feod-surface);
  padding: 0;
}

.feod-landing__island--cta {
  text-align: center;
}

.feod-landing__island--footer {
  text-align: center;
  margin-bottom: 24px;
}

.feod-landing__hero-split {
  display: grid;
  gap: 20px;
}

@media (min-width: 900px) {
  .feod-landing__hero-split {
    grid-template-columns: 1.05fr 0.95fr;
    align-items: stretch;
    gap: 24px;
  }
}

.feod-landing__hero-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px 24px;
}

.feod-landing__hero-right {
  position: relative;
  border-radius: 20px;
  padding: 28px;
  border: 1px solid var(--feod-border);
  background-image: url('/back3.png');
  background-size: cover;
  background-position: center;
  overflow: hidden;
  min-height: 100%;
}

.feod-landing__hero-right > * {
  position: relative;
  z-index: 1;
}

.feod-landing__hero-right-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.feod-landing__file-tree {
  background: var(--feod-surface);
  border: 1px solid var(--feod-border);
  border-radius: 12px;
  padding: 12px 0;
}

.feod-landing__eyebrow {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--feod-text-weak);
}

.feod-landing__eyebrow-pill {
  border: 1px solid var(--feod-border-strong);
  padding: 6px 12px;
  border-radius: 999px;
}

.feod-landing__title {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  line-height: 1.1;
}

.feod-landing__lead {
  color: var(--feod-text-muted);
  max-width: 560px;
}

.feod-landing__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
  justify-content: center;
}

.feod-landing__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.feod-landing__stat {
  border: 1px solid var(--feod-border);
  border-radius: 16px;
  padding: 16px;
  background: var(--feod-chip-bg);
}

.feod-landing__stat-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--feod-text-weak);
  margin: 0;
}

.feod-landing__stat-value {
  margin: 6px 0 0;
  font-size: 1.1rem;
}

.feod-landing__panel {
  position: relative;
  z-index: 2;
  border: 1px solid var(--feod-border);
  border-radius: 20px;
  padding: 22px;
  background: var(--feod-panel-bg);
}


.feod-landing__panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.feod-landing__panel-title {
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #d9f99d;
  margin: 0;
  text-decoration: none;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}


.feod-landing__panel-footer {
  margin-top: 16px;
  border-radius: 12px;
  border: 1px solid var(--feod-border);
  background: var(--feod-panel-muted);
  padding: 12px 14px;
  color: var(--feod-panel-muted-text);
}

.feod-landing__panel-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--feod-panel-muted-text);
  margin: 0 0 12px 0;
}

.feod-landing__panel-value {
  color: var(--feod-panel-muted-text);
}

.feod-landing__panel-footer .feod-link {
  color: var(--feod-link);
}

.feod-landing__panel-footer .feod-link:hover {
  color: var(--feod-link-hover);
}

.feod-landing__panel-value {
  margin: 6px 0 0;
}

.feod-landing__section {
  padding: 0 16px;
}

.feod-landing__container {
  max-width: 1160px;
  margin: 0 auto 32px;
  padding: 0 8px;
}

.feod-landing__section-header {
  text-align: left;
  max-width: 720px;
  margin: 0 0 32px;
}

.feod-landing__section-header p {
  color: var(--feod-text-muted);
}

.feod-landing__pillars {
  display: grid;
  gap: 20px;
}

@media (min-width: 900px) {
  .feod-landing__pillars {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feod-card {
  border: 1px solid var(--feod-border);
  border-radius: 18px;
  padding: 22px;
  background: var(--feod-surface-strong);
}

.feod-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
}

.feod-card__icon svg {
  width: 22px;
  height: 22px;
}

.feod-card__title {
  margin: 16px 0 8px;
}

.feod-card__text {
  color: var(--feod-text-muted);
}

.feod-landing__split {
  display: grid;
  gap: 32px;
}

@media (min-width: 900px) {
  .feod-landing__split {
    grid-template-columns: 1.05fr 0.95fr;
    align-items: center;
  }
}

.feod-landing__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.feod-chip {
  border: 1px solid var(--feod-border-strong);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  background: var(--feod-chip-bg);
  color: var(--feod-chip-text);
}

.feod-note {
  margin-top: 20px;
  border: 1px solid var(--feod-border-strong);
  border-radius: 16px;
  padding: 14px 16px;
  background: var(--feod-note-bg);
}

.feod-note__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--feod-text-weak);
  margin: 0 0 8px;
}

.feod-landing__split-panel {
  border: 1px solid var(--feod-border);
  border-radius: 18px;
  padding: 22px;
  background: var(--feod-surface-strong);
}

.feod-landing__code {
  margin: 16px 0 24px;
  font-family: "KH Teka Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: var(--feod-text-muted);
}

.feod-landing__rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feod-rule {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feod-rule__tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.15);
  color: var(--vp-c-brand-1);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.feod-rule__tag--stop {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.feod-landing__outcomes {
  display: grid;
  gap: 32px;
}

@media (min-width: 900px) {
  .feod-landing__outcomes {
    grid-template-columns: 1fr 2fr;
    align-items: start;
  }
}

.feod-landing__outcomes-text p {
  color: var(--feod-text-muted);
}

.feod-landing__outcomes-grid {
  display: grid;
  gap: 16px;
}

@media (min-width: 900px) {
  .feod-landing__outcomes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feod-card--dark {
  background: var(--feod-surface-strong);
}

.feod-landing__cases {
  display: grid;
  gap: 32px;
}

@media (min-width: 900px) {
  .feod-landing__cases {
    grid-template-columns: 0.9fr 1.1fr;
    align-items: start;
  }
}

.feod-landing__case-panel {
  border: 1px solid var(--feod-border);
  border-radius: 18px;
  padding: 22px;
  background: var(--feod-surface-strong);
}

.feod-landing__list {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feod-landing__list-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feod-landing__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}

.feod-landing__steps {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

@media (min-width: 700px) {
  .feod-landing__steps {
    grid-template-columns: repeat(2, 1fr);
  }
}

.feod-step {
  border: 1px solid var(--feod-border);
  border-radius: 16px;
  padding: 16px;
  background: var(--feod-surface-strong);
}

.feod-step__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--feod-text-weak);
  margin: 0 0 8px;
}

.feod-landing__cta {
  padding: 0 16px;
}

.feod-landing__cta-inner {
  max-width: 720px;
  margin: 0 auto;
}

.feod-landing__cta-inner p {
  color: var(--feod-text-muted);
  margin-top: 16px;
  margin-bottom: 20px;
}

.feod-landing__footer {
  padding: 0 16px;
}

.feod-landing__footer-links {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.feod-landing__footer-links a {
  color: var(--feod-text-weak);
  text-decoration: none;
}

.feod-landing__footer-links a:hover {
  color: var(--feod-text);
}

.feod-landing__tools {
  display: grid;
  gap: 20px;
}

@media (min-width: 900px) {
  .feod-landing__tools {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}


</style>
