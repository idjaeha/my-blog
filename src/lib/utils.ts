import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, locale: string = "ko"): string {
  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getReadingTime(text: string, locale: string = "ko"): number {
  // 한국어: ~500자/분, 영어: ~200단어/분
  if (locale === "ko") {
    const chars = text.replace(/\s/g, "").length;
    return Math.max(1, Math.ceil(chars / 500));
  }
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
