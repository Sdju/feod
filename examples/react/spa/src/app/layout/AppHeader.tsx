import { Link, NavLink } from "react-router-dom";
import { CartWidget } from "@/modules/Cart";
import { UserWidget } from "@/modules/User";
import "./AppHeader.scss";
const navigation = [
  { name: "Главная", path: "/" },
  { name: "Каталог", path: "/catalog" },
  { name: "О проекте", path: "/about" },
];
export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__container">
        <Link to="/" className="app-header__logo">
          FEOD Shop
        </Link>
        <nav className="app-header__nav">
          <ul className="app-header__nav-list">
            {navigation.map((item) => (
              <li key={item.path} className="app-header__nav-item">
                <NavLink to={item.path} className="app-header__nav-link">
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="app-header__widgets">
          <CartWidget />
          <UserWidget />
        </div>
      </div>
    </header>
  );
}
