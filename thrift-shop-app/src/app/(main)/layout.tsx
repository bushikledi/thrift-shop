/**
 * Main Layout
 * Wraps customer-facing pages with header and footer. Admin/vendor users are
 * redirected away from the customer-only pages (cart, checkout, account,
 * orders) but can browse the catalog like anyone else.
 */
"use client";

import { Header, Footer } from "@/components/layout";
import { RoleBasedRedirect } from "@/components/shared/auth-guard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleBasedRedirect>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1" role="main">
          {children}
        </main>
        <Footer />
      </div>
    </RoleBasedRedirect>
  );
}
