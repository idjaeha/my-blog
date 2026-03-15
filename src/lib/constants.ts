export const SITE = {
  title: "Jaeha's Blog",
  description: "개인 기술 블로그 - TIL, 프로젝트 회고, 기술 아티클",
  url: "https://your-blog.vercel.app",
  author: "Jaeha Yi",
  defaultLocale: "ko" as const,
} as const;

export const PAGINATION = {
  postsPerPage: 10,
} as const;

export const CATEGORIES = {
  til: { ko: "TIL", en: "TIL" },
  retrospective: { ko: "회고", en: "Retrospective" },
  article: { ko: "아티클", en: "Article" },
  tutorial: { ko: "튜토리얼", en: "Tutorial" },
} as const;
