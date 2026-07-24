/**
 * Theme Store
 *
 * Persists the user's colour-scheme preference and applies it by toggling the
 * `dark` class on <html>, which is what the stylesheet keys off. "system"
 * follows the OS setting and keeps following it while selected.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

/** Resolves "system" to the OS preference and applies the class. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia(SYSTEM_DARK_QUERY).matches;

  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // Default to the warm light marketplace theme rather than following the
      // OS (which would show the dark variant for most users).
      theme: "light",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        // Re-apply once the persisted value is restored on load.
        if (state) applyTheme(state.theme);
      },
    }
  )
);
