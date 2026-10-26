import Link from "next/link";

export default function NotFound() {
  return (
    <section>
      <h1>Страница не найдена</h1>
      <Link href="/">На главную</Link>
    </section>
  );
}
