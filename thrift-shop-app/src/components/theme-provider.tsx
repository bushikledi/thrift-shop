"use client";

import { useEffect } from "react";
import { applyTheme, useThemeStore } from "@/lib/stores/theme-store";

/**
 * Applies the stored theme on load and keeps "system" in sync with the OS
 * preference while it stays selected.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return <>{children}</>;
}
