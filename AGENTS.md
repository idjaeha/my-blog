# AGENTS.md — my-blog

Canonical agent guide for this repo. If you only read one file, read this one.

## 1. Project purpose

재하의 개인 기술 블로그 (`https://jaeha.dev` 류). Astro 6 정적 사이트 + Supabase
콘텐츠 백엔드 + 별도 MCP 서버를 통해 AI 도구로 글 CRUD가 가능하다. 운영자는
1인 (재하 본인). 한/영 다국어, 다크모드, Pagefind 검색, Mermaid 다이어그램,
동적 OG 이미지 지원.

## 2. Setup

```bash
# 의존성 (Node.js >= 22.12, pnpm 10)
pnpm install
cd mcp-server && pnpm install && cd ..

# 환경 변수
cp .env.example .env   # 그리고 Supabase / API 키 채워 넣기

# 개발 서버 (http://localhost:4321)
pnpm dev

# 검증 — 커밋 전에 통과해야 함
pnpm typecheck         # astro check
pnpm lint              # eslint .
pnpm test              # vitest (unit + components)
pnpm test:mcp          # mcp-server vitest

# 프로덕션 빌드
pnpm build
pnpm preview

# MCP 서버 빌드 (별도)
cd mcp-server && pnpm build
```

CI (`.github/workflows/ci.yml`)가 `typecheck → lint → test → test:mcp → build`
순서로 동일하게 돌린다. 로컬에서 같은 순서로 통과하면 CI도 통과한다.

## 3. Hard rules / Don't touch

- **Secrets**: `.env`는 커밋 금지 (`.gitignore`에 이미 있음). `SUPABASE_SERVICE_KEY`,
  `BLOG_API_KEY`, `ISR_BYPASS_TOKEN`, `TELEGRAM_BOT_TOKEN`은 절대 코드/문서에
  하드코딩하지 말 것. PR 본문, 커밋 메시지, 이슈에도 노출 금지.
- **Lint/Type 통과 후 커밋**: `pnpm lint`, `pnpm typecheck`, `pnpm test` 모두
  통과 상태에서만 커밋. husky + lint-staged가 staged 파일에 prettier를 자동
  적용하지만 typecheck/test는 강제하지 않으므로 직접 돌릴 것.
- **Supabase 마이그레이션**: `supabase/` 디렉토리의 마이그레이션 SQL은 한 번
  적용된 파일을 수정하지 않는다. 변경이 필요하면 새 마이그레이션 파일을 추가.
- **`mcp-server/dist/`**: 빌드 산출물. 직접 수정 금지. `.gitignore`에 의해
  추적되지 않음 — 변경하려면 `mcp-server/src/`를 고치고 `pnpm build`.
- **글 작성 (MCP 경유)**: `mcp-server/`의 글쓰기 규칙(두괄식, H1 금지, GFM
  Alerts, Mermaid 코드블록 등)은 MCP 서버 자체가 system prompt로 강제한다.
  사람이 직접 글을 손볼 때도 동일 규칙을 따른다.
- **컴포넌트**: `src/components/ui/`는 shadcn/ui 생성 파일. 가능하면 직접
  수정 대신 shadcn CLI로 재생성하는 쪽을 우선 고려.
- **Scheduling**: do not call `Register-ScheduledTask` or `schtasks /create` directly. Edit `D:/playground/playground-ops/schedules.yaml` and run `pwsh -File D:/playground/playground-ops/scripts/register.ps1`. Reverse-drift audit (06:00 KST) reports any direct registration.

## 4. Stack

| 영역       | 기술                                             |
| ---------- | ------------------------------------------------ |
| 프레임워크 | Astro 6 (정적 빌드, Vercel adapter)              |
| UI         | React 19 (Islands)                               |
| 스타일링   | Tailwind CSS 4 + shadcn/ui + Base UI             |
| 콘텐츠     | Supabase (PostgreSQL) + Markdown                 |
| 렌더링     | unified / remark-gfm / rehype-pretty-code        |
| 검색       | Pagefind (정적 인덱스)                           |
| 다이어그램 | Mermaid (클라이언트 렌더링) + rehype-mermaid     |
| OG 이미지  | Satori + Sharp                                   |
| MCP 서버   | `mcp-server/` — `@modelcontextprotocol/sdk`, zod |
| 테스트     | Vitest + Testing Library + happy-dom             |
| 패키지     | pnpm 10 (workspace 아님, blog + mcp-server 별도) |
| 배포       | Vercel (`@astrojs/vercel`)                       |
| Node       | >= 22.12.0                                       |

아키텍처:

```
[MCP Server (Claude/봇)] → [REST API (/api/*, API Key 필요)] → [Supabase]
[Astro Build]            → [supabaseBlogLoader]              → [Supabase]
                             → renderMarkdown() → 정적 페이지
```

## 5. Operations

- **배포**: `main` 브랜치에 push → Vercel 자동 배포. 별도 수동 절차 없음.
  Vercel 환경 변수에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_KEY` 셋업 필요.
- **ISR**: On-Demand Revalidation은 `ISR_BYPASS_TOKEN`로 게이팅됨. 셋업
  자세한 내용은 `docs/deployment/isr-setup.md` 와
  `docs/deployment/edge-function-setup.md` 참조.
- **MCP 서버**: 빌드 산출물은 `mcp-server/dist/index.js`. Claude Code /
  텔레그램 봇이 이 경로를 spawn한다. `BLOG_API_URL`이 가리키는 API
  엔드포인트(기본 `http://localhost:4321/api`)에 `BLOG_API_KEY`로 인증.
- **자주 쓰는 스크립트**:

  ```bash
  # MDX → Supabase 마이그레이션
  node --env-file=.env --import=tsx scripts/migrate-to-supabase.ts

  # API 키 새로 생성
  node --env-file=.env --import=tsx scripts/generate-api-key.ts <key-name>

  # Mermaid 다이어그램 빌드 시 검증
  pnpm validate:mermaid
  ```

- **로그**: 정적 사이트라 런타임 로그 없음. 빌드 로그는 Vercel 대시보드.
  로컬 개발 서버 로그는 `.dev-server.log` (gitignored 아님이지만 임시 파일).

## 6. Telegram delivery

Telegram supergroup `-1003853102198`의 forum topic `my-blog` (thread_id `98`)에
이 프로젝트의 알림이 전달된다. 키는 `.env`에 셋업되어 있다:

| 변수                 | 값                                                 |
| -------------------- | -------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | telegram-claude-bot과 동일 (단일 봇 인스턴스 공유) |
| `TELEGRAM_CHAT_ID`   | `-1003853102198`                                   |
| `TELEGRAM_THREAD_ID` | `98`                                               |

**현재 상태**: 자동 알림 routine은 아직 없다 (forward-looking). 키만 준비되어
있고, 향후 배포 성공/실패, 새 글 발행, ISR 트리거 같은 이벤트 알림이
추가되면 위 3개 키를 사용한다. `sendMessage` 호출 시 반드시
`message_thread_id=98`을 함께 보내야 my-blog 토픽에 들어간다 (생략하면 그룹의
General 토픽으로 감).

3-layer 예시 (추후 구현 시):

1. `scripts/notify-telegram.{ts,mjs}` 같은 공통 헬퍼
2. `pnpm` 스크립트 또는 GitHub Actions에서 호출
3. 실패 시 silent fail — 본 작업 흐름을 막지 않음

## 7. Conventions

### Plan documentation

새 작업 계획을 세울 때 `docs/plans/`에 문서를 추가한다.

- 파일명: `YYYY-MM-DD-간결한-설명.md`
- 포맷: `docs/plans/_template.md`를 따른다 (목표 / 배경 / 접근 방식 /
  구현 단계 / 검증 체크리스트)

### Troubleshooting documentation

버그를 해결한 뒤 `docs/troubleshooting/`에 기록한다.

- 파일명: `NNN-간결한-설명.md` (NNN은 기존 파일의 다음 순번, zero-pad 3자리)
- 포맷: `docs/troubleshooting/_template.md`를 따른다 (증상 / 원인 / 해결 /
  관련 파일)

### 글쓰기 (블로그 콘텐츠)

MCP 서버를 통해 작성하면 system prompt가 강제하지만, 직접 편집하더라도 동일
규칙: H1 금지(프론트매터 title이 H1), 두괄식 (첫 섹션이 핵심 결론), 문단
2-4문장, 비교는 표/절차는 번호목록/대안은 불릿, GFM Alerts(`> [!NOTE]`),
Mermaid 코드블록, JSX 컴포넌트 사용 금지. 자세한 가이드는
`docs/guides/writing-post.md`.

### 커밋 메시지

기존 히스토리는 conventional-commit 스타일 (`feat:`, `fix:`, `docs:`,
`fix(types):`). 가능하면 동일 스타일을 따른다. 한국어/영문 혼용 OK.
