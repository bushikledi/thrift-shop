"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Globe,
  LogOut,
  Package,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAuthStore,
  useCartStore,
  useLocaleStore,
  useUIStore,
} from "@/lib/stores";

export function Header() {
  const t = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const { locale, setLocale } = useLocaleStore();
  const { toggleCart, toggleSearch } = useUIStore();

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch]);

  const handleLogout = async () => {
    await logout();
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "sq" : "en");
    // Set cookie and reload to apply new locale
    document.cookie = `locale=${
      locale === "en" ? "sq" : "en"
    }; path=/; max-age=31536000`;
    window.location.reload();
  };

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/shop", label: t("nav.shop") },
    { href: "/categories", label: t("nav.categories") },
    { href: "/vendors", label: t("nav.vendors") },
  ];

  return (
    <header 
      className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md transition-all hover:opacity-80"
            aria-label="ThriftShop Home"
          >
            <span className="text-xl font-bold text-primary">ThriftShop</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Click to open modal */}
          <button
            onClick={toggleSearch}
            className="hidden lg:flex items-center w-full max-w-sm mx-4 px-4 py-2 rounded-md border bg-background hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Search products"
          >
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              {t("common.searchPlaceholder")}
            </span>
            <kbd className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border">
              ⌘K
            </kbd>
          </button>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Search Icon (Mobile/Tablet) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleSearch}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLocale}
              title={locale === "en" ? "Shqip" : "English"}
            >
              <Globe className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={toggleCart}
              aria-label={`Shopping cart with ${cartItemCount} items`}
              aria-live="polite"
            >
              <ShoppingCart className="h-5 w-5" />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-medium"
                    aria-hidden="true"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === "VENDOR" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {t("nav.dashboard")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">
                      <Package className="mr-2 h-4 w-4" />
                      {t("nav.orders")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/saved">
                      <Heart className="mr-2 h-4 w-4" />
                      {t("nav.savedItems")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("nav.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">{t("nav.signup")}</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              id="mobile-menu"
              className="md:hidden overflow-hidden border-t"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="menu"
              aria-label="Mobile navigation menu"
            >
              <div className="py-4 space-y-4">
                {/* Mobile Search Button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    toggleSearch();
                  }}
                  className="w-full flex items-center px-4 py-3 rounded-md border bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">
                    {t("common.searchPlaceholder")}
                  </span>
                </button>

                {/* Mobile Nav Links */}
                <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        className="block px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:bg-muted/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                        role="menuitem"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Auth Links */}
                {!isAuthenticated && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Link
                      href="/login"
                      className="flex-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        {t("nav.login")}
                      </Button>
                    </Link>
                    <Link
                      href="/signup"
                      className="flex-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button className="w-full">{t("nav.signup")}</Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
