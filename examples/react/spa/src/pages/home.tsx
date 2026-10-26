import { useNavigate } from "react-router-dom";
import MainButton from "@/common/ui/MainButton";
import placeholder from "@/common/assets/img/placeholder.png";
import "./home.scss";
const features = [
  { title: "Широкий ассортимент", description: "Тысячи товаров на любой вкус" },
  { title: "Быстрая доставка", description: "Доставляем заказы в кратчайшие сроки" },
  { title: "Гарантия качества", description: "Только проверенные товары от надежных поставщиков" },
];
export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="main-page">
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Добро пожаловать в FEOD Shop</h1>
          <p className="hero__description">Ваш надежный магазин с широким ассортиментом товаров</p>
          <MainButton size="large" onClick={() => navigate("/catalog")}>
            Перейти в каталог
          </MainButton>
        </div>
        <img src={placeholder} alt="Hero image" className="hero__image" />
      </section>
      <section className="features">
        <h2 className="features__title">Наши преимущества</h2>
        <div className="features__grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <img src={placeholder} alt={feature.title} className="feature-card__image" />
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__description">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
