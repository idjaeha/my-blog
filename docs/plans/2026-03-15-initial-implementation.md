# Blog Project Implementation Plan

> `docs/spec.md` 기반 단계별 구현 계획
> 최종 수정: 2026-03-15

---

## Phase Overview

```
Phase 1: Foundation          ██████░░░░░░░░░░░░░░  (프로젝트 초기화 + 핵심 인프라)
Phase 2: Content Layer       ████████░░░░░░░░░░░░  (콘텐츠 스키마 + 추상화 계층)
Phase 3: Layout & Design     ██████████░░░░░░░░░░  (레이아웃 + 디자인 시스템)
Phase 4: Pages & Routing     ████████████░░░░░░░░  (페이지 + i18n 라우팅)
Phase 5: Interactive Islands ██████████████░░░░░░  (React 아일랜드 컴포넌트)
Phase 6: MDX & Rich Content  ████████████████░░░░  (MDX 컴포넌트 + Mermaid + 코드)
Phase 7: SEO & Distribution  ██████████████████░░  (SEO + RSS + OG + Sitemap)
Phase 8: Search & MCP        ████████████████████  (Pagefind + MCP 서버)
Phase 9: DX & Deployment     ████████████████████  (린팅 + CI + Vercel)
```

### 의존성 그래프

```
Phase 1 ─→ Phase 2 ─→ Phase 3 ─→ Phase 4
                │                    │
                ▼                    ▼
             Phase 8            Phase 5
             (MCP)              Phase 6
                                Phase 7
                                   │
                                   ▼
                                Phase 9
```

- Phase 1~4는 순차적 (각 단계가 이전 단계에 의존)
- Phase 5, 6, 7은 Phase 4 완료 후 병렬 진행 가능
- Phase 8 (MCP)은 Phase 2 완료 후 독립적으로 진행 가능
- Phase 9는 모든 단계 완료 후 최종 마무리

---

## Phase 1: Foundation (프로젝트 초기화)

> 목표: Astro + React + Tailwind + TypeScript 프로젝트 뼈대 완성

### 1.1 Astro 프로젝트 생성

```bash
pnpm create astro@latest . --template minimal --typescript strict
```

### 1.2 핵심 의존성 설치

```bash
# Astro integrations
pnpm add @astrojs/react @astrojs/tailwind @astrojs/sitemap @astrojs/rss @astrojs/vercel

# React
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom

# Tailwind
pnpm add tailwindcss @tailwindcss/typography

# Build tools
pnpm add -D typescript
```

### 1.3 설정 파일 작성

| 파일                 | 내용                                                          |
| -------------------- | ------------------------------------------------------------- |
| `astro.config.ts`    | React, Tailwind, Sitemap 통합 + i18n + Shiki + rehype-mermaid |
| `tailwind.config.ts` | darkMode: "class", typography 플러그인, shadcn/ui 호환        |
| `tsconfig.json`      | strict 모드, path alias (`@/` → `src/`)                       |
| `components.json`    | shadcn/ui 설정 (React, Tailwind CSS path)                     |

### 1.4 shadcn/ui 초기화 및 기본 컴포넌트 설치

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card badge input dialog
```

### 1.5 디렉토리 구조 생성

```bash
mkdir -p src/{components/{ui,islands,layout,blog,mdx},layouts,lib/content,i18n,pages/{blog/tags,en/blog/tags},styles}
mkdir -p src/content/blog/{ko,en,_archive}
mkdir -p public/{fonts,og}
mkdir -p mcp-server/src/tools
mkdir -p docs
```

### 1.6 글로벌 스타일 작성

- `src/styles/globals.css` — Tailwind directives + shadcn/ui CSS 변수 (라이트/다크)

### Tasks

- [ ] 1.1 Astro 프로젝트 생성
- [ ] 1.2 의존성 설치
- [ ] 1.3 설정 파일 작성 (astro.config.ts, tailwind.config.ts, tsconfig.json, components.json)
- [ ] 1.4 shadcn/ui 초기화 + 기본 컴포넌트 설치
- [ ] 1.5 디렉토리 구조 생성
- [ ] 1.6 globals.css 작성
- [ ] **검증**: `pnpm dev` 실행 → 빈 페이지 정상 렌더링 확인

---

## Phase 2: Content Layer (콘텐츠 계층)

> 목표: Zod 스키마 + Content Abstraction Layer + 샘플 포스트

### 2.1 Content Schema 정의

- `src/content.config.ts` — Zod 스키마 (title, description, category, tags, publishedDate, draft, coverImage, series, seriesOrder)

### 2.2 Content Abstraction Layer 구현

| 파일                              | 내용                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/lib/content/types.ts`        | `Post`, `ContentService` 인터페이스                                                                                 |
| `src/lib/content/astro-loader.ts` | `AstroContentLoader` 클래스 (getPost, getAllPosts, getPostsByTag, getPostsByCategory, getAllTags, getAllCategories) |
| `src/lib/content/index.ts`        | `contentService` 싱글톤 export                                                                                      |

### 2.3 유틸리티 & 상수

| 파일                   | 내용                                             |
| ---------------------- | ------------------------------------------------ |
| `src/lib/constants.ts` | SITE, PAGINATION, CATEGORIES 상수                |
| `src/lib/utils.ts`     | 날짜 포맷, 읽기 시간 계산, cn() (clsx + twMerge) |

### 2.4 샘플 콘텐츠 작성

- `src/content/blog/ko/hello-world.mdx` — 한국어 샘플 포스트
- `src/content/blog/en/hello-world.mdx` — 영어 샘플 포스트

### Tasks

- [ ] 2.1 content.config.ts 작성 (Zod 스키마)
- [ ] 2.2 Content Abstraction Layer 구현 (types.ts, astro-loader.ts, index.ts)
- [ ] 2.3 constants.ts + utils.ts 작성
- [ ] 2.4 한/영 샘플 포스트 작성
- [ ] **검증**: Astro 빌드 시 Content Collections 정상 로드 확인

---

## Phase 3: Layout & Design System (레이아웃 + 디자인)

> 목표: 공통 레이아웃 + 헤더/푸터 + 다크모드 + Typography

### 3.1 레이아웃

| 파일                               | 내용                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| `src/layouts/BaseLayout.astro`     | HTML 셸, BaseHead 포함, 다크모드 클래스, 슬롯            |
| `src/layouts/BlogPostLayout.astro` | 포스트 상세 레이아웃 (prose 클래스, TOC 슬롯, prev/next) |
| `src/layouts/PageLayout.astro`     | 일반 페이지 레이아웃                                     |

### 3.2 레이아웃 컴포넌트

| 파일                                         | 내용                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `src/components/layout/BaseHead.astro`       | 메타 태그, OG 태그, hreflang, RSS 링크, FOUC 방지 스크립트            |
| `src/components/layout/Header.astro`         | 네비게이션 (홈, 블로그, 소개), 언어 토글, 테마 토글, 모바일 메뉴 슬롯 |
| `src/components/layout/Footer.astro`         | 저작권, 소셜 링크, RSS 링크                                           |
| `src/components/layout/LanguageToggle.astro` | 한/영 전환 링크                                                       |

### 3.3 i18n 시스템

| 파일                | 내용                                                          |
| ------------------- | ------------------------------------------------------------- |
| `src/i18n/index.ts` | Locale 타입, t() 함수, getLocaleFromUrl(), getLocalizedPath() |
| `src/i18n/ko.ts`    | 한국어 UI 문자열                                              |
| `src/i18n/en.ts`    | 영어 UI 문자열                                                |

### Tasks

- [ ] 3.1 BaseLayout.astro 작성
- [ ] 3.2 BlogPostLayout.astro 작성
- [ ] 3.3 PageLayout.astro 작성
- [ ] 3.4 BaseHead.astro 작성 (메타 태그 + FOUC 방지)
- [ ] 3.5 Header.astro 작성
- [ ] 3.6 Footer.astro 작성
- [ ] 3.7 LanguageToggle.astro 작성
- [ ] 3.8 i18n 시스템 구현 (index.ts, ko.ts, en.ts)
- [ ] **검증**: 다크모드 토글, 언어 전환, 반응형 헤더 동작 확인

---

## Phase 4: Pages & Routing (페이지 + 라우팅)

> 목표: 모든 라우트 구현 + 블로그 컴포넌트 + 페이지네이션

### 4.1 블로그 컴포넌트 (Astro)

| 컴포넌트               | 내용                                       |
| ---------------------- | ------------------------------------------ |
| `PostCard.astro`       | 카드 UI (제목, 설명, 날짜, 태그, 카테고리) |
| `PostList.astro`       | PostCard 리스트 렌더링                     |
| `TagList.astro`        | 태그 Badge 목록                            |
| `CategoryFilter.astro` | 카테고리 필터 탭/버튼                      |
| `Pagination.astro`     | 페이지네이션 네비게이션                    |
| `PostNavigation.astro` | 이전/다음 글 네비게이션                    |

### 4.2 한국어 페이지 (기본)

| 페이지                        | Route              | 내용                                        |
| ----------------------------- | ------------------ | ------------------------------------------- |
| `pages/index.astro`           | `/`                | 히어로 + 최신 글 + 카테고리별 미리보기      |
| `pages/about.astro`           | `/about`           | 자기소개                                    |
| `pages/blog/index.astro`      | `/blog`            | 전체 글 목록 + 페이지네이션 + 카테고리 필터 |
| `pages/blog/[...slug].astro`  | `/blog/[slug]`     | 포스트 상세 (MDX 렌더링 + TOC + prev/next)  |
| `pages/blog/tags/index.astro` | `/blog/tags`       | 전체 태그 목록 + 포스트 수                  |
| `pages/blog/tags/[tag].astro` | `/blog/tags/[tag]` | 태그별 필터링 목록                          |

### 4.3 영어 페이지 (미러 구조)

`pages/en/` 하위에 동일 구조 생성. locale 파라미터를 "en"으로 전달.

### Tasks

- [ ] 4.1 블로그 컴포넌트 6개 작성 (PostCard, PostList, TagList, CategoryFilter, Pagination, PostNavigation)
- [ ] 4.2 한국어 페이지 6개 작성
- [ ] 4.3 영어 페이지 6개 작성 (미러)
- [ ] **검증**: 모든 라우트 접근 가능, 페이지네이션 동작, 태그/카테고리 필터링 확인

---

## Phase 5: Interactive Islands (React 아일랜드)

> 목표: 인터랙티브 UI 컴포넌트 구현 (선택적 하이드레이션)
> 의존성: Phase 4 완료 후 진행 (Phase 6, 7과 병렬 가능)

### 5.1 React Islands

| 컴포넌트              | 디렉티브      | 기능                                       |
| --------------------- | ------------- | ------------------------------------------ |
| `ThemeToggle.tsx`     | `client:load` | 라이트/다크 모드 전환, localStorage 저장   |
| `MobileNav.tsx`       | `client:load` | 모바일 햄버거 메뉴 (Dialog 기반)           |
| `SearchModal.tsx`     | `client:idle` | Pagefind 연동 검색 모달 (Phase 8에서 완성) |
| `TableOfContents.tsx` | `client:idle` | 포스트 목차, 스크롤 위치 하이라이팅        |
| `CopyCodeButton.tsx`  | `client:idle` | 코드 블록 복사 버튼                        |

### 5.2 React Bits 통합

- 히어로 섹션용 텍스트 애니메이션 컴포넌트 선정 및 통합
- `client:visible` 디렉티브 적용

```bash
pnpm add react-bits  # 또는 필요한 애니메이션 라이브러리
```

### Tasks

- [ ] 5.1 ThemeToggle.tsx 구현
- [ ] 5.2 MobileNav.tsx 구현
- [ ] 5.3 SearchModal.tsx 스켈레톤 구현 (Pagefind 연동은 Phase 8)
- [ ] 5.4 TableOfContents.tsx 구현 (heading 추출 + IntersectionObserver)
- [ ] 5.5 CopyCodeButton.tsx 구현
- [ ] 5.6 React Bits 히어로 애니메이션 통합
- [ ] 5.7 Header/BlogPostLayout에 아일랜드 통합
- [ ] **검증**: 각 아일랜드 독립 동작 확인, JS 번들 크기 점검

---

## Phase 6: MDX & Rich Content (MDX 컴포넌트 + Mermaid)

> 목표: 커스텀 MDX 컴포넌트 + Mermaid + 코드 하이라이팅
> 의존성: Phase 4 완료 후 진행 (Phase 5, 7과 병렬 가능)

### 6.1 MDX 컴포넌트

| 컴포넌트             | 유형  | 기능                                                |
| -------------------- | ----- | --------------------------------------------------- |
| `Callout.tsx`        | React | 정보/경고/위험 등 강조 박스                         |
| `CodeBlock.tsx`      | React | Shiki 코드 블록 래퍼 (파일명 표시, 라인 하이라이팅) |
| `MermaidDiagram.tsx` | React | 클라이언트 사이드 Mermaid 렌더링 (Fallback용)       |
| `LinkCard.tsx`       | React | 외부 링크 프리뷰 카드                               |
| `Image.astro`        | Astro | 반응형 이미지 + lazy loading                        |

### 6.2 Mermaid 빌드 타임 설정

```bash
pnpm add mermaid
pnpm add -D rehype-mermaid
```

- `astro.config.ts`에 `rehype-mermaid` 플러그인 추가
- 코드 펜스 ````mermaid` 블록 자동 SVG 변환
- 다크모드 대응 CSS 작성

### 6.3 MDX 컴포넌트 매핑

BlogPostLayout에서 MDX 렌더링 시 커스텀 컴포넌트 매핑 설정.

### Tasks

- [ ] 6.1 Callout.tsx 구현 (info, warning, danger, tip 타입)
- [ ] 6.2 CodeBlock.tsx 구현 (파일명, 라인 하이라이팅)
- [ ] 6.3 MermaidDiagram.tsx 구현 (client:visible Fallback)
- [ ] 6.4 rehype-mermaid 설치 및 astro.config.ts 설정
- [ ] 6.5 LinkCard.tsx 구현
- [ ] 6.6 Image.astro 구현
- [ ] 6.7 MDX 컴포넌트 매핑 설정
- [ ] 6.8 Mermaid 다크모드 CSS 작성
- [ ] 6.9 샘플 포스트에 모든 MDX 컴포넌트 + Mermaid 사용 예시 추가
- [ ] **검증**: 샘플 포스트에서 Callout, CodeBlock, Mermaid, LinkCard, Image 정상 렌더링 확인

---

## Phase 7: SEO & Distribution (SEO + RSS + OG)

> 목표: 메타 태그, JSON-LD, RSS, Sitemap, 동적 OG 이미지
> 의존성: Phase 4 완료 후 진행 (Phase 5, 6과 병렬 가능)

### 7.1 SEO

- BaseHead.astro에 OG/Twitter 메타 태그 (Phase 3에서 작성, 여기서 보강)
- JSON-LD 구조화 데이터 (BlogPosting, Person)
- `hreflang` 태그

### 7.2 RSS 피드

| 파일                  | Route                |
| --------------------- | -------------------- |
| `pages/rss.xml.ts`    | `/rss.xml` (한국어)  |
| `pages/en/rss.xml.ts` | `/en/rss.xml` (영어) |

### 7.3 동적 OG 이미지

```bash
pnpm add satori sharp
```

| 파일                        | Route                     |
| --------------------------- | ------------------------- |
| `pages/og/[...slug].png.ts` | `/og/[locale]/[slug].png` |

- `satori`로 JSX → SVG, `sharp`로 SVG → PNG
- 포스트 제목, 카테고리, 날짜 표시
- 커스텀 폰트 로드 (한국어 지원)

### 7.4 Sitemap

`@astrojs/sitemap` 통합 (Phase 1에서 설치 완료, 여기서 설정 확인).

### Tasks

- [ ] 7.1 JSON-LD 스크립트 추가 (BlogPostLayout)
- [ ] 7.2 한국어 RSS 피드 구현
- [ ] 7.3 영어 RSS 피드 구현
- [ ] 7.4 동적 OG 이미지 생성 엔드포인트 구현
- [ ] 7.5 OG 이미지 디자인 (satori 템플릿)
- [ ] 7.6 한국어 폰트 번들링 (OG 이미지용)
- [ ] 7.7 Sitemap 설정 확인
- [ ] **검증**: RSS 피드 유효성, OG 이미지 생성, 소셜 미디어 미리보기 확인

---

## Phase 8: Search & MCP Server (Pagefind + MCP)

> 목표: Pagefind 검색 통합 + blog-mcp 서버 구현
> 의존성: MCP는 Phase 2 이후, Search는 Phase 5 이후

### 8.1 Pagefind 검색

```bash
pnpm add -D pagefind
```

- `package.json` 빌드 스크립트에 `pagefind --site dist` 추가
- SearchModal.tsx에 Pagefind API 연동
- 한국어 CJK 토크나이저 설정
- 언어별 인덱스 분리

### 8.2 MCP Server 구현

```bash
cd mcp-server
pnpm init
pnpm add @modelcontextprotocol/sdk gray-matter
pnpm add -D typescript @types/node
```

#### MCP Tools 구현 순서

1. **`get-post.ts`** — 포스트 조회 (다른 도구의 기반)
2. **`list-posts.ts`** — 포스트 목록
3. **`create-post.ts`** — 포스트 생성
4. **`edit-post-metadata.ts`** — 메타데이터 수정
5. **`publish-post.ts`** — draft → published
6. **`delete-post.ts`** — 소프트 삭제 (\_archive/)
7. **`list-tags.ts`** — 태그 집계
8. **`list-categories.ts`** — 카테고리 집계

#### MCP Server 엔트리

- `mcp-server/src/index.ts` — Server 인스턴스 생성, 도구 등록, stdio 연결
- `.mcp.json` — 프로젝트 루트에 MCP 서버 등록

### Tasks

- [ ] 8.1 Pagefind 설치 및 빌드 스크립트 설정
- [ ] 8.2 SearchModal.tsx에 Pagefind API 연동 완성
- [ ] 8.3 Pagefind CJK 토크나이저 설정
- [ ] 8.4 mcp-server 패키지 초기화 (package.json, tsconfig.json)
- [ ] 8.5 MCP 도구 8개 구현
- [ ] 8.6 MCP 서버 엔트리 (index.ts) 작성
- [ ] 8.7 .mcp.json 작성
- [ ] 8.8 MCP 서버 빌드 스크립트 설정
- [ ] **검증**: Pagefind 검색 동작 (한/영), MCP 도구 `create_post` → `list_posts` → `get_post` → `publish_post` 플로우 테스트

---

## Phase 9: DX & Deployment (개발 경험 + 배포)

> 목표: 린팅, Git Hooks, CI/CD, Vercel 배포
> 의존성: 모든 Phase 완료 후 최종 마무리

### 9.1 린팅 & 포맷팅

```bash
pnpm add -D eslint prettier prettier-plugin-astro prettier-plugin-tailwindcss
pnpm add -D @eslint/js typescript-eslint eslint-plugin-astro
```

- ESLint flat config 설정 (Astro + TypeScript + React)
- Prettier 설정 (Astro + Tailwind 플러그인)

### 9.2 Git Hooks

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

- lint-staged 설정: `*.{ts,tsx,astro}` → eslint + prettier, `*.{css,md,mdx,json}` → prettier

### 9.3 CI 파이프라인

- `.github/workflows/ci.yml` 작성
  - TypeScript 타입체크
  - ESLint 린트
  - Astro 빌드
  - Pagefind 인덱싱

### 9.4 Vercel 배포

- Vercel 프로젝트 연결
- 환경 변수 설정 (필요 시)
- 프리뷰 배포 동작 확인
- 프로덕션 배포

### Tasks

- [ ] 9.1 ESLint flat config 작성
- [ ] 9.2 Prettier 설정 (.prettierrc)
- [ ] 9.3 Husky + lint-staged 설정
- [ ] 9.4 CI 워크플로우 작성 (.github/workflows/ci.yml)
- [ ] 9.5 Vercel 프로젝트 연결 및 첫 배포
- [ ] 9.6 프리뷰 배포 동작 확인
- [ ] **검증**: CI 파이프라인 전체 통과, Vercel 프로덕션 배포 성공, Lighthouse 성능 점수 확인

---

## Implementation Notes

### 병렬 작업 전략

Phase 4 완료 후 다음 작업을 병렬로 진행할 수 있다:

| Stream A              | Stream B              | Stream C           |
| --------------------- | --------------------- | ------------------ |
| Phase 5 (Islands)     | Phase 6 (MDX/Mermaid) | Phase 7 (SEO)      |
| ThemeToggle, TOC, ... | Callout, Mermaid, ... | RSS, OG Image, ... |

Phase 8의 MCP 서버는 Phase 2 완료 직후부터 독립적으로 진행 가능하다.

### 점진적 검증

각 Phase 완료 시 `pnpm build`로 정적 빌드가 깨지지 않는지 확인한다.
Phase 4 이후부터는 `pnpm preview`로 전체 사이트를 로컬에서 검증한다.

### 리스크 & 대응

| 리스크                             | 영향                | 대응                                   |
| ---------------------------------- | ------------------- | -------------------------------------- |
| rehype-mermaid 빌드 시간 증가      | 빌드 성능           | 다이어그램 수 제한, 캐싱 검토          |
| Pagefind CJK 토크나이저 정확도     | 한국어 검색 품질    | 인덱싱 옵션 튜닝, 커스텀 사전          |
| satori 한국어 폰트 번들 크기       | OG 이미지 빌드 시간 | 서브셋 폰트 사용                       |
| shadcn/ui + Astro SSR 호환성       | 컴포넌트 렌더링     | 서버 컴포넌트 vs 아일랜드 구분 명확화  |
| Content Abstraction Layer 오버헤드 | 개발 복잡도         | v1에서는 가볍게 유지, CMS 전환 시 확장 |

### Milestone Checkpoints

| Milestone          | 시점             | 기준                                             |
| ------------------ | ---------------- | ------------------------------------------------ |
| **M1: Skeleton**   | Phase 2 완료     | 빈 블로그 빌드 성공, 샘플 포스트 렌더링          |
| **M2: Navigable**  | Phase 4 완료     | 모든 페이지 라우팅 동작, 페이지네이션, 태그 필터 |
| **M3: Polished**   | Phase 5+6+7 완료 | 다크모드, 검색 UI, MDX, Mermaid, SEO, RSS, OG    |
| **M4: Launchable** | Phase 9 완료     | CI 통과, Vercel 배포, Lighthouse 90+             |
