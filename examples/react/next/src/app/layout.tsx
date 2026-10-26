import type { Metadata } from "next";
import { StoreProviders } from "./_providers/StoreProviders";
import ShopShell from "./_shell/ShopShell";
import "./_styles/globals.css";

export const metadata: Metadata = {
  title: { default: "FEOD Shop", template: "%s - FEOD Shop" },
  description: "Демонстрационный магазин FEOD",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>
        <StoreProviders>
          <ShopShell>{children}</ShopShell>
        </StoreProviders>
      </body>
    </html>
  );
}
