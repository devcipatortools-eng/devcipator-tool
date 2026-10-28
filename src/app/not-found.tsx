import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-28 text-center">
      <p className="font-mono text-sm font-semibold text-primary">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-fg">This page doesn&apos;t exist</h1>
      <p className="text-fg-muted">The tool or page you are looking for may have moved. Browse all tools instead.</p>
      <Link href="/" className="mt-2 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-fg hover:bg-primary-hover">
        Browse all tools
      </Link>
    </div>
  );
}
