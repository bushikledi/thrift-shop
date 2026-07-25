import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Down for maintenance — ThriftShop",
  description: "The store is temporarily unavailable while we tidy up.",
};

/**
 * Shown when the API reports maintenance mode (503). The apiClient sends
 * shoppers here so they get an explanation instead of a page full of failed
 * requests. Admins are never redirected — they still need to reach the
 * settings page to switch maintenance mode back off.
 */
export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <span className="text-3xl" aria-hidden>
          🧵
        </span>
      </div>
      <p className="mt-6 text-sm font-medium text-primary">
        Down for maintenance
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
        We&apos;re rearranging the racks
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The store is briefly closed while we make some improvements. Your cart
        and orders are safe — please check back in a few minutes.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </Link>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          Staff sign in
        </Link>
      </div>
    </div>
  );
}
