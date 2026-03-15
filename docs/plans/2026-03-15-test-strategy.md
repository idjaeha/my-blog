# Blog 프로젝트 테스트 전략

> 최종 수정: 2026-03-15
> 상태: 완료

## 목표

Phase 1~9 구현 완료된 블로그 프로젝트에 테스트 프레임워크를 도입하고, 단계적으로 테스트를 작성한다.

## 테스트 프레임워크: Vitest

Vite 기반(Astro와 동일 번들러), ESM 네이티브, Astro 공식 권장.

## 테스트 대상 분류 (3계층)

### Layer 1: Unit Tests — 순수 로직

| 파일                   | 테스트 대상                                       |
| ---------------------- | ------------------------------------------------- |
| `src/lib/utils.ts`     | `formatDate()`, `getReadingTime()`, `cn()`        |
| `src/i18n/index.ts`    | `getLocaleFromUrl()`, `t()`, `getLocalizedPath()` |
| `src/lib/constants.ts` | SITE, CATEGORIES 구조 검증                        |

### Layer 2: Integration Tests — MCP Server

임시 디렉토리 기반 실제 파일 I/O 테스트.

| 파일                                         | 테스트 대상                     |
| -------------------------------------------- | ------------------------------- |
| `mcp-server/src/tools/create-post.ts`        | MDX 생성, 중복 방지, 프론트매터 |
| `mcp-server/src/tools/list-posts.ts`         | 필터링, 정렬, 페이지네이션      |
| `mcp-server/src/tools/get-post.ts`           | 조회, 없는 파일 에러            |
| `mcp-server/src/tools/edit-post-metadata.ts` | 메타데이터 수정, updatedDate    |
| `mcp-server/src/tools/publish-post.ts`       | draft→published 전환            |
| `mcp-server/src/tools/delete-post.ts`        | \_archive 이동                  |
| `mcp-server/src/tools/list-tags.ts`          | 태그 집계, 정렬                 |
| `mcp-server/src/tools/list-categories.ts`    | 카테고리 집계                   |

### Layer 3: Component Tests — React Islands

happy-dom 환경에서 인터랙티브 동작 검증.

| 컴포넌트             | 테스트 대상                      |
| -------------------- | -------------------------------- |
| `ThemeToggle.tsx`    | 다크모드 토글, localStorage 저장 |
| `SearchModal.tsx`    | Cmd+K 단축키, 모달 열기/닫기     |
| `CopyCodeButton.tsx` | 클립보드 복사, "Copied" 피드백   |

## 결과

| Layer       | 테스트 파일 | 테스트 수 |
| ----------- | ----------- | --------- |
| Unit        | 3           | 30        |
| Integration | 8 + helpers | 63        |
| Component   | 3           | 24        |
| **합계**    | **14**      | **130**   |

## 설정 파일

- `vitest.config.ts` — `vitest/config`의 `defineConfig` 사용 (`getViteConfig` 사용 시 Vite 플러그인 충돌)
- `mcp-server/vitest.config.ts` — Astro 의존 없이 순수 Node.js

## 스크립트

- `pnpm test` — unit + component
- `pnpm test:mcp` — MCP integration
- `pnpm test:watch` / `pnpm test:ui` / `pnpm test:coverage`

## CI 통합

`.github/workflows/ci.yml`에 `pnpm test` + `pnpm test:mcp` 추가.
