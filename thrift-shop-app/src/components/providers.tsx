"use client";

import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "sonner";
import { CartDrawer } from "@/components/cart";
import { SearchModal } from "@/components/search/search-modal";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection time)
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Auth initializer component
function AuthInitializer({ children }: { children: ReactNode }) {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Only check auth if we're not already authenticated and not loading
    // This prevents unnecessary API calls on every render
    if (!isLoading && !isAuthenticated) {
      checkAuth();
    }
  }, [checkAuth, isAuthenticated, isLoading]);

  return <>{children}</>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthInitializer>
          {children}
          <CartDrawer />
          <SearchModal />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              className: "!bg-background !text-foreground !border",
            }}
            expand={false}
          />
        </AuthInitializer>
      </NextIntlClientProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
