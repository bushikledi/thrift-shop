import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const locales = ["en", "sq"] as const;
export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // Check cookie first, then Accept-Language header
  const cookieStore = await cookies();
  const headersList = await headers();

  let locale: Locale = defaultLocale;

  // Check for locale cookie
  const localeCookie = cookieStore.get("locale")?.value;
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  } else {
    // Fall back to Accept-Language header
    const acceptLanguage = headersList.get("accept-language");
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage
        .split(",")
        .map((lang) => lang.split(";")[0].trim().substring(0, 2))
        .find((lang) => locales.includes(lang as Locale));
      if (preferredLocale) {
        locale = preferredLocale as Locale;
      }
    }
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
    timeZone: "UTC", // Default timezone to prevent environment mismatches
  };
});
