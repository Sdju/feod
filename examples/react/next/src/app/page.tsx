import type { Metadata } from "next";
import HomePage from "@/screens/home";

// Шаблон заголовка из root layout не применяется к странице того же сегмента.
export const metadata: Metadata = { title: { absolute: "Главная - FEOD Shop" } };

export default function Page() {
  return <HomePage />;
}
