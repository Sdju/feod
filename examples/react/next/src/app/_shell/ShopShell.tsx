import type { ReactNode } from "react";
import Link from "next/link";
import { CartWidget } from "@/modules/Cart";
import { UserWidget } from "@/modules/User";
import AppFooter from "./AppFooter";
import NavLinks from "./NavLinks";
import "./ShopShell.scss";

export default function ShopShell({ children }: { children: ReactNode }) {
  return (
    <div className="layout-default">
      <header className="app-header">
        <div className="app-header__container">
          <Link href="/" className="app-header__logo">FEOD Shop</Link>
          <nav className="app-header__nav" aria-label="Основная навигация">
            <NavLinks />
          </nav>
          <div className="app-header__widgets">
            <CartWidget />
            <UserWidget />
          </div>
        </div>
      </header>
      <main className="layout-default__main">
        <div className="layout-default__container">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}
