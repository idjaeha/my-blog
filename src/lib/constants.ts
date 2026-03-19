export const SITE = {
  title: "재하의 개발 블로그",
  description: "재하의 개발 블로그 - TIL, 프로젝트 회고, 기술 아티클",
  url: "https://my-blog.site",
  author: {
    name: "재하",
    email: undefined as string | undefined, // Optional: Add your email
    url: undefined as string | undefined, // Optional: Add your personal website/portfolio URL
    social: {
      github: undefined as string | undefined, // Optional: Add your GitHub username (e.g., "username")
      twitter: undefined as string | undefined, // Optional: Add your Twitter/X handle (e.g., "@username")
      linkedin: undefined as string | undefined, // Optional: Add your LinkedIn profile URL
    },
  },
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
  infra: { ko: "인프라", en: "Infra" },
} as const;
