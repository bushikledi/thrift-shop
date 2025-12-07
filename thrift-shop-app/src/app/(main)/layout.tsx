/**
 * Main Layout
 * Wraps customer-facing pages with header, footer and redirects admin/vendor users
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
