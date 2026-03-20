# 재하의 개발 블로그

Astro 6 + React 19 + Tailwind CSS 4 기반의 개인 기술 블로그.

## 기술 스택

| 영역       | 기술                            |
| ---------- | ------------------------------- |
| 프레임워크 | Astro 6 (정적 빌드)             |
| UI         | React 19 (Islands Architecture) |
| 스타일링   | Tailwind CSS 4 + shadcn/ui      |
| 콘텐츠     | Supabase + Markdown             |
| 검색       | Pagefind                        |
| 다이어그램 | Mermaid (클라이언트 렌더링)     |
| OG 이미지  | Satori + Sharp                  |
| MCP        | blog-mcp (Supabase API 연동)    |
| 배포       | Vercel                          |

## 주요 기능

- 한/영 다국어 지원 (i18n)
- 다크모드 (시스템 설정 연동 + 수동 토글)
- Markdown 커스텀 블록 (GFM Alerts, Mermaid, 코드 하이라이팅)
- 카테고리/태그 기반 필터링 + 페이지네이션
- RSS 피드 (한/영 각각)
- 동적 OG 이미지 생성
- Pagefind 기반 전문 검색
- MCP Server를 통한 AI 기반 콘텐츠 관리
- REST API 엔드포인트 (Supabase 연동)

## 시작하기

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Supabase 키 입력

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 빌드 미리보기
pnpm preview
```

Node.js 22 이상이 필요합니다.

## 프로젝트 구조

```
├── src/
│   ├── components/
│   │   ├── blog/         # PostCard, PostList, Pagination 등
│   │   ├── islands/      # ThemeToggle, SearchModal, CopyCodeButton 등
│   │   ├── layout/       # Header, Footer, BaseHead
│   │   ├── mdx/          # Callout, MermaidDiagram, LinkCard 등
│   │   └── ui/           # shadcn/ui 컴포넌트
│   ├── content/
│   │   └── supabase-loader.ts  # Supabase 커스텀 콘텐츠 로더
│   ├── i18n/             # 다국어 번역 파일
│   ├── layouts/          # BaseLayout, BlogPostLayout, PageLayout
│   ├── lib/              # 유틸리티, Supabase 클라이언트
│   ├── pages/
│   │   └── api/          # REST API 엔드포인트
│   └── styles/           # globals.css
├── mcp-server/           # MCP Server (별도 패키지)
├── supabase/             # Supabase 마이그레이션
├── scripts/              # 마이그레이션, API 키 생성 스크립트
├── tests/                # 테스트
│   ├── unit/             # 순수 로직 테스트
│   ├── integration/mcp/  # MCP 도구 통합 테스트
│   └── components/       # React 컴포넌트 테스트
└── docs/                 # 프로젝트 문서
```

## 아키텍처

Supabase가 유일한 콘텐츠 소스입니다:

```
[MCP Server] → [REST API (/api/*)] → [Supabase]
[Astro Build] → [supabaseBlogLoader] → [Supabase] → 정적 페이지 생성
```

- **빌드 시**: Astro 커스텀 로더가 Supabase에서 글을 fetch → `renderMarkdown()`로 HTML 변환 → 정적 페이지 생성
- **콘텐츠 관리**: MCP Server 또는 REST API로 Supabase CRUD

## API 엔드포인트

| 메서드 | 경로                | 인증    | 설명             |
| ------ | ------------------- | ------- | ---------------- |
| GET    | `/api/posts`        | 불필요  | 게시물 목록      |
| POST   | `/api/posts`        | API Key | 게시물 생성      |
| GET    | `/api/posts/[slug]` | 불필요  | 게시물 조회      |
| PATCH  | `/api/posts/[slug]` | API Key | 게시물 수정      |
| DELETE | `/api/posts/[slug]` | API Key | 게시물 아카이브  |
| GET    | `/api/tags`         | 불필요  | 태그 목록+카운트 |
| GET    | `/api/categories`   | 불필요  | 카테고리+카운트  |

쓰기 작업에는 `Authorization: Bearer <API_KEY>` 헤더가 필요합니다.

## MCP Server

블로그 콘텐츠를 AI 도구에서 관리할 수 있는 MCP Server가 포함되어 있습니다. API 엔드포인트를 통해 Supabase와 통신합니다.

```bash
# MCP Server 빌드
cd mcp-server && pnpm build
```

제공하는 도구:

| 도구                 | 설명                               |
| -------------------- | ---------------------------------- |
| `create-post`        | 새 포스트 생성                     |
| `list-posts`         | 포스트 목록 (필터링, 페이지네이션) |
| `get-post`           | 포스트 조회                        |
| `edit-post-metadata` | 메타데이터 수정                    |
| `publish-post`       | 드래프트 → 발행                    |
| `delete-post`        | 소프트 삭제 (아카이브)             |
| `list-tags`          | 태그 집계                          |
| `list-categories`    | 카테고리 집계                      |

## 환경 변수

`.env.example`을 참고하여 `.env` 파일을 생성하세요.

| 변수                   | 용도                                 |
| ---------------------- | ------------------------------------ |
| `SUPABASE_URL`         | Supabase 프로젝트 URL                |
| `SUPABASE_ANON_KEY`    | Supabase 공개 키 (빌드 시 읽기 전용) |
| `SUPABASE_SERVICE_KEY` | Supabase 서비스 키 (API 쓰기 작업)   |
| `BLOG_API_KEY`         | MCP 서버용 API 인증 키               |

## 유틸리티 스크립트

```bash
# MDX 파일을 Supabase로 마이그레이션
node --env-file=.env --import=tsx scripts/migrate-to-supabase.ts

# API 키 생성
node --env-file=.env --import=tsx scripts/generate-api-key.ts <key-name>
```

## 테스트

```bash
# 유닛 + 컴포넌트 테스트
pnpm test

# MCP 통합 테스트
pnpm test:mcp

# Watch 모드
pnpm test:watch

# UI 모드
pnpm test:ui
```

## 배포

Vercel에 연결되어 있으며, `main` 브랜치에 push하면 자동 배포됩니다.
Vercel 환경 변수에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`를 설정해야 합니다.

```bash
# 수동 빌드 확인
pnpm build
```
