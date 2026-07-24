import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <span className="text-3xl" aria-hidden>
          🧺
        </span>
      </div>
      <p className="mt-6 text-sm font-medium text-primary">
        404 — Page not found
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
        Let&apos;s get you back to the good stuff.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back home
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          Browse the shop
        </Link>
      </div>
    </div>
  );
}
