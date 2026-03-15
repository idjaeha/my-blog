# 재하의 개발 블로그

Astro 6 + React 19 + Tailwind CSS 4 기반의 개인 기술 블로그.

## 기술 스택

| 영역       | 기술                            |
| ---------- | ------------------------------- |
| 프레임워크 | Astro 6 (정적 빌드)             |
| UI         | React 19 (Islands Architecture) |
| 스타일링   | Tailwind CSS 4 + shadcn/ui      |
| 콘텐츠     | MDX + gray-matter               |
| 검색       | Pagefind                        |
| 다이어그램 | Mermaid (클라이언트 렌더링)     |
| OG 이미지  | Satori + Sharp                  |
| MCP        | blog-mcp (콘텐츠 관리 도구)     |
| 배포       | Vercel                          |

## 주요 기능

- 한/영 다국어 지원 (i18n)
- 다크모드 (시스템 설정 연동 + 수동 토글)
- MDX 커스텀 컴포넌트 (Callout, CodeBlock, Mermaid, LinkCard)
- 카테고리/태그 기반 필터링 + 페이지네이션
- RSS 피드 (한/영 각각)
- 동적 OG 이미지 생성
- Pagefind 기반 전문 검색
- MCP Server를 통한 AI 기반 콘텐츠 관리

## 시작하기

```bash
# 의존성 설치
pnpm install

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
│   ├── content/blog/
│   │   ├── ko/           # 한국어 글
│   │   └── en/           # 영어 글
│   ├── i18n/             # 다국어 번역 파일
│   ├── layouts/          # BaseLayout, BlogPostLayout, PageLayout
│   ├── lib/              # 유틸리티, 상수
│   ├── pages/            # 라우트
│   └── styles/           # globals.css
├── mcp-server/           # MCP Server (별도 패키지)
├── tests/                # 테스트
│   ├── unit/             # 순수 로직 테스트
│   ├── integration/mcp/  # MCP 도구 통합 테스트
│   └── components/       # React 컴포넌트 테스트
└── docs/                 # 프로젝트 문서
```

## MCP Server

블로그 콘텐츠를 AI 도구에서 관리할 수 있는 MCP Server가 포함되어 있습니다.

```bash
# MCP Server 빌드
cd mcp-server && pnpm build
```

제공하는 도구:

| 도구                 | 설명                               |
| -------------------- | ---------------------------------- |
| `create-post`        | 새 MDX 포스트 생성                 |
| `list-posts`         | 포스트 목록 (필터링, 페이지네이션) |
| `get-post`           | 포스트 조회                        |
| `edit-post-metadata` | 프론트매터 수정                    |
| `publish-post`       | 드래프트 → 발행                    |
| `delete-post`        | 소프트 삭제 (\_archive 이동)       |
| `list-tags`          | 태그 집계                          |
| `list-categories`    | 카테고리 집계                      |

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

```bash
# 수동 빌드 확인
pnpm build
```
