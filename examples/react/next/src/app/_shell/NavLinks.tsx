"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation: { name: string; path: Route }[] = [
  { name: "Главная", path: "/" },
  { name: "Каталог", path: "/catalog" },
  { name: "Корзина", path: "/cart" },
  { name: "Профиль", path: "/profile" },
  { name: "О проекте", path: "/about" },
];

function isActive(pathname: string, path: string) {
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="app-header__nav-list">
      {navigation.map((item) => (
        <li key={item.path}>
          <Link
            className="app-header__nav-link"
            href={item.path}
            aria-current={isActive(pathname, item.path) ? "page" : undefined}
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
