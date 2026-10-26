import type { Metadata } from "next";
import AboutPage from "@/screens/about";

export const metadata: Metadata = { title: "О проекте" };

export default function Page() {
  return <AboutPage />;
}
