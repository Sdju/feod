import Image from "next/image";
import MainButton from "@/common/ui/MainButton";
import "./home.scss";
const placeholder = "/placeholder.png";
const features = [
  { title: "Широкий ассортимент", description: "Тысячи товаров на любой вкус" },
  { title: "Быстрая доставка", description: "Доставляем заказы в кратчайшие сроки" },
  { title: "Гарантия качества", description: "Только проверенные товары от надежных поставщиков" },
];
export default function HomePage() {
  return (
    <div className="main-page">
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Добро пожаловать в FEOD Shop</h1>
          <p className="hero__description">Ваш надежный магазин с широким ассортиментом товаров</p>
          <MainButton size="large" href="/catalog">
            Перейти в каталог
          </MainButton>
        </div>
        <Image src={placeholder} alt="Hero image" width={600} height={400} className="hero__image" priority />
      </section>
      <section className="features">
        <h2 className="features__title">Наши преимущества</h2>
        <div className="features__grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <Image src={placeholder} alt={feature.title} width={120} height={120} className="feature-card__image" />
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__description">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
