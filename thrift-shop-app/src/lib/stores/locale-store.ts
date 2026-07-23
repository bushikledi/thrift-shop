/**
 * Locale Store
 * Manages locale/language state using Zustand
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "en" | "sq";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/**
 * Switches the application language.
 *
 * next-intl resolves messages on the server from the `locale` cookie, so the
 * cookie must be set and the page reloaded for the change to take effect.
 * Shared by the header switcher and the account settings page.
 */
export function changeLocale(locale: Locale): void {
  useLocaleStore.getState().setLocale(locale);
  document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "locale-storage",
    }
  )
);

