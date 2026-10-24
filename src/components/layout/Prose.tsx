import type { ReactNode } from "react";

export function ProsePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-fg">{title}</h1>
      <div className="mt-8 flex flex-col gap-5 text-base leading-relaxed text-fg-muted [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg [&_strong]:text-fg">
        {children}
      </div>
    </article>
  );
}
