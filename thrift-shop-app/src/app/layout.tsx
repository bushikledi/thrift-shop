import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/shared";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "ThriftShop - Discover Unique Finds",
    template: "%s | ThriftShop",
  },
  description:
    "Shop curated vintage, secondhand & thrift items from trusted sellers.",
  keywords: [
    "thrift",
    "vintage",
    "secondhand",
    "sustainable fashion",
    "albania",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers locale={locale} messages={messages}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
