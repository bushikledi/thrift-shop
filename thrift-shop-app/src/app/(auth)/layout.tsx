/**
 * Auth Layout
 * Wraps authentication pages (login, signup, etc.) with header and footer
 */
import { Header, Footer } from "@/components/layout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
}
