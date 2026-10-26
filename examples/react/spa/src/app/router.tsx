import { createBrowserRouter, Link } from "react-router-dom";
import HomePage from "@/pages/home";
import CatalogPage from "@/pages/catalog";
import CartPage from "@/pages/cart";
import ProfilePage from "@/pages/profile";
import AboutPage from "@/pages/about";
import Layout from "./layout/Layout";
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", handle: { title: "Главная" }, element: <HomePage /> },
      { path: "/catalog", handle: { title: "Каталог" }, element: <CatalogPage /> },
      { path: "/cart", handle: { title: "Корзина" }, element: <CartPage /> },
      { path: "/profile", handle: { title: "Профиль" }, element: <ProfilePage /> },
      { path: "/about", handle: { title: "О проекте" }, element: <AboutPage /> },
      {
        path: "*",
        handle: { title: "Страница не найдена" },
        element: (
          <section>
            <h1>Страница не найдена</h1>
            <Link to="/">На главную</Link>
          </section>
        ),
      },
    ],
  },
]);
