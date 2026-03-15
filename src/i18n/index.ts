import ko from "@/i18n/ko";
import en from "@/i18n/en";

export type Locale = "ko" | "en";
export const defaultLocale: Locale = "ko";

export function getLocaleFromUrl(url: URL): Locale {
  const [, locale] = url.pathname.split("/");
  return locale === "en" ? "en" : "ko";
}

export function t(key: string, locale: Locale): string {
  const translations = locale === "ko" ? ko : en;
  return translations[key] ?? key;
}

export function getLocalizedPath(path: string, locale: Locale): string {
  if (locale === "ko") return path;
  return `/en${path}`;
}
