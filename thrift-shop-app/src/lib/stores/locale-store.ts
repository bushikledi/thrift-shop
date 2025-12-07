/**
 * Locale Store
 * Manages locale/language state using Zustand
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocaleState {
  locale: "en" | "sq";
  setLocale: (locale: "en" | "sq") => void;
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

