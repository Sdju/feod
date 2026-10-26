"use client";

import MainButton from "@/common/ui/MainButton";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section>
      <h1>Что-то пошло не так</h1>
      <MainButton onClick={reset}>Попробовать снова</MainButton>
    </section>
  );
}
