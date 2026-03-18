# 블로그 AI 접근성 및 SEO 종합 개선

> 최종 수정: 2026-03-18
> 상태: 완료

## 목표

검색 엔진, 대화형 AI(ChatGPT, Claude), 개발자 도구 AI가 블로그에 쉽게 접근하고 콘텐츠를 효과적으로 이해할 수 있도록 SEO를 종합적으로 개선한다.

## 배경

현재 블로그는 Astro 6 기반으로 Sitemap, RSS Feed, 기본 Open Graph 등 많은 SEO 기능이 이미 구현되어 있지만, AI 크롤러 특화 설정, 구조화된 데이터(JSON-LD), 상세한 메타데이터 등이 부족한 상태였다. 검색 엔진과 AI 시스템이 블로그 콘텐츠를 더 정확하게 인덱싱하고 이해할 수 있도록 포괄적인 개선이 필요했다.

## 접근 방식

1. **AI 크롤러 지원**: robots.txt를 통해 주요 AI 크롤러(GPTBot, Claude-Web, Google-Extended 등)를 명시적으로 허용
2. **메타데이터 확장**: 기존 메타 태그에 keywords, author, robots, theme-color 등을 추가
3. **구조화된 데이터**: Schema.org 기반 JSON-LD를 활용하여 Organization, WebSite, BlogPosting 정보 제공
4. **Open Graph 강화**: article:author, article:section, article:tag 등 추가 정보 포함
5. **RSS Feed 개선**: 카테고리, 태그, 저자 정보를 RSS 항목에 추가
6. **저자 정보 구조화**: SITE.author를 객체로 확장하여 상세 정보 지원

## 구현 단계

### 1단계 — 필수 SEO 기반 구축

**1.1 robots.txt 생성** (`public/robots.txt`)

- AI 크롤러 허용 목록 명시 (GPTBot, ChatGPT-User, Claude-Web, ClaudeBot, Google-Extended, PerplexityBot, CCBot)
- Sitemap 위치 명시
- 크롤 규칙 설정

**1.2 저자 정보 구조 확장** (`src/lib/constants.ts`)

```typescript
author: {
  name: "재하",
  email: undefined,
  url: undefined,
  social: {
    github: undefined,
    twitter: undefined,
    linkedin: undefined,
  }
}
```

- 관련 파일 수정: `tests/unit/constants.test.ts`, `src/pages/og/[...slug].png.ts`, `src/layouts/BlogPostLayout.astro`, `src/components/layout/Footer.astro`

**1.3 메타데이터 확장** (`src/components/layout/BaseHead.astro`)

- `keywords` 메타 태그 (포스트 태그 활용)
- `author` 메타 태그
- `robots` 메타 태그 (draft 포스트 noindex 처리)
- `theme-color` 메타 태그 (light/dark 모드)

### 2단계 — 구조화 데이터 강화

**2.1 SEO 컴포넌트 디렉토리 생성** (`src/components/seo/`)

**2.2 OrganizationSchema 컴포넌트** (`src/components/seo/OrganizationSchema.astro`)

- Schema.org Organization 타입
- 사이트 이름, URL, 로고, 설명
- 소셜 프로필 링크 (sameAs)

**2.3 WebSiteSchema 컴포넌트** (`src/components/seo/WebSiteSchema.astro`)

- Schema.org WebSite 타입
- 사이트 정보 및 다국어 지원
- SearchAction (검색 기능 명시)

**2.4 BlogPosting JSON-LD 확장** (`src/layouts/BlogPostLayout.astro`)

- 카테고리에 따라 TechArticle vs BlogPosting 구분
- author 정보 확장 (url, sameAs)
- publisher (Organization)
- image (ImageObject)
- keywords, articleSection, inLanguage 추가

**2.5 BaseLayout 통합** (`src/layouts/BaseLayout.astro`)

- OrganizationSchema, WebSiteSchema 컴포넌트 추가
- Props 확장 (tags, category, draft)

### 3단계 — Open Graph & Twitter 확장

**3.1 Open Graph 메타데이터 추가** (`src/components/layout/BaseHead.astro`)

- `og:site_name`
- `article:author` (작성자 URL)
- `article:section` (카테고리)
- `article:tag` (태그 목록)

**3.2 Twitter Card 메타데이터 추가**

- `twitter:site` (사이트 트위터 계정)
- `twitter:creator` (작성자 트위터 계정)

### 4단계 — RSS Feed 개선

**4.1 한국어 RSS Feed** (`src/pages/rss.xml.ts`)

- categories: 카테고리 + 태그 목록
- author: 저자 이름 및 이메일
- customData: 업데이트 날짜

**4.2 영어 RSS Feed** (`src/pages/en/rss.xml.ts`)

- 동일한 개선 사항 적용

## 검증

- [x] robots.txt가 생성되고 주요 AI 크롤러가 허용됨
- [x] 메타 태그 (keywords, author, robots, theme-color)가 추가됨
- [x] SITE.author 구조가 확장되고 관련 파일이 모두 수정됨
- [x] OrganizationSchema와 WebSiteSchema가 구현되고 BaseLayout에 통합됨
- [x] BlogPosting JSON-LD가 확장됨 (author, publisher, image, keywords, articleSection, inLanguage)
- [x] Open Graph 메타데이터가 확장됨 (og:site_name, article:author, article:section, article:tag)
- [x] Twitter Card 메타데이터가 확장됨 (twitter:site, twitter:creator)
- [x] RSS Feed에 카테고리, 태그, 저자 정보가 추가됨
- [ ] 빌드 후 실제 HTML에서 메타 태그가 올바르게 렌더링되는지 확인
- [ ] Google Search Console, Bing Webmaster Tools에 사이트맵 제출
- [ ] Schema.org Validator로 JSON-LD 검증
- [ ] RSS Feed Validator로 RSS 피드 검증

## 추가 개선 사항 (선택)

### 이미지 접근성

- MDX 이미지 alt 텍스트 가이드라인 작성
- 기존 포스트 이미지 alt 텍스트 추가

### 추가 Schema

- BreadcrumbList (네비게이션 구조)
- ImageObject 세부 정보

### 성능 최적화

- 리소스 힌트 (preconnect, dns-prefetch)
- 페이지네이션 메타 태그 (rel="prev/next")

### 검증 도구

- MCP 서버에 SEO 검증 도구 추가
- Lighthouse CI 통합

## 참고 사항

사용자는 `src/lib/constants.ts`에서 다음 정보를 채워넣어야 합니다:

- `SITE.author.email`: 이메일 주소
- `SITE.author.url`: 개인 웹사이트/포트폴리오 URL
- `SITE.author.social.github`: GitHub 사용자명 또는 URL
- `SITE.author.social.twitter`: 트위터 핸들 또는 URL
- `SITE.author.social.linkedin`: LinkedIn 프로필 URL

이 정보들은 선택 사항이지만, 채워넣을 경우 더 풍부한 SEO 정보를 제공할 수 있습니다.
