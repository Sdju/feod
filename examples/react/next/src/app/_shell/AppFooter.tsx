import "./AppFooter.scss";
export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__container">
        <div className="app-footer__content">
          <div className="app-footer__section">
            <h3 className="app-footer__title">О нас</h3>
            <p className="app-footer__text">
              FEOD Shop - демонстрационный магазин, построенный по методологии Fractal Entity
              Oriented Design
            </p>
          </div>
          <div className="app-footer__section">
            <h3 className="app-footer__title">Контакты</h3>
            <ul className="app-footer__list">
              <li className="app-footer__item">Email: info@feodshop.com</li>
              <li className="app-footer__item">Телефон: +7 (999) 123-45-67</li>
            </ul>
          </div>
        </div>
        <div className="app-footer__bottom">
          <p className="app-footer__copyright">
            © {new Date().getFullYear()} FEOD Shop. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
