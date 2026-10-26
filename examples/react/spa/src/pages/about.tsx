import "./about.scss";

const principles = [
  { title: "Фрактальность", description: "Модули можно дробить на подмодули без смены правил." },
  { title: "Сущности", description: "Каждый файл имеет роль и ограничения по использованию." },
  { title: "Уровни", description: "Четкие правила импортов между слоями проекта." },
];
export default function AboutPage() {
  return (
    <section className="about-page">
      <h1 className="about-page__title">О FEOD Shop</h1>
      <p className="about-page__lead">
        Этот проект демонстрирует структуру FEOD на примере простого интернет-магазина.
      </p>
      <div className="about-page__grid">
        {principles.map((item) => (
          <article key={item.title} className="about-card">
            <h2 className="about-card__title">{item.title}</h2>
            <p className="about-card__description">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
