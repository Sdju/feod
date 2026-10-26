import { useEffect } from "react";
import { Outlet, useMatches } from "react-router-dom";
import { CartProvider } from "@/modules/Cart";
import { UserProvider } from "@/modules/User";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";
import "./Layout.scss";
export default function Layout() {
  const matches = useMatches();
  const title = matches
    .map((match) => match.handle as { title?: string } | undefined)
    .find((handle) => handle?.title)?.title;
  useEffect(() => {
    document.title = title ? `${title} - FEOD Shop` : "FEOD Shop";
  }, [title]);
  return (
    <CartProvider>
      <UserProvider>
        <div className="layout-default">
          <AppHeader />
          <main className="layout-default__main">
            <div className="layout-default__container">
              <Outlet />
            </div>
          </main>
          <AppFooter />
        </div>
      </UserProvider>
    </CartProvider>
  );
}
