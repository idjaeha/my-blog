# ISR (Incremental Static Regeneration) 설정 가이드

## 개요

Supabase에 게시글을 추가/수정하면 자동으로 해당 페이지가 무효화되고 재생성되는 On-Demand Revalidation 시스템이다.

### 아키텍처

```
Supabase DB (posts 테이블 변경)
  ↓
Database Webhook (자동 payload)
  ↓
Supabase Edge Function (revalidate-blog)
  - ISR_BYPASS_TOKEN을 환경변수에서 가져옴 (보안)
  - slug, locale 추출 및 draft 필터링
  ↓
Vercel Revalidation API (/api/revalidate)
  ↓
페이지 무효화 및 재생성
```

### 작동 원리

1. **초기 빌드**: Vercel에 배포 시 모든 블로그 페이지를 정적으로 생성
2. **CDN 캐싱**: 생성된 페이지는 Vercel Edge Network에 캐싱됨
3. **변경 감지**: Supabase의 `posts` 테이블에 변경 발생 (INSERT/UPDATE/DELETE)
4. **Webhook → Edge Function**: Database Webhook이 Supabase Edge Function 호출
5. **Edge Function → Vercel API**: Edge Function이 `/api/revalidate` 엔드포인트 호출
6. **무효화 요청**: Vercel API가 해당 페이지 재생성 요청
7. **재생성**: 다음 방문 시 최신 데이터로 페이지 재생성

---

## 1. 환경변수 설정

> **중요**: 이 단계는 Vercel과 Supabase 양쪽 모두에서 필요합니다.

### 1.1 ISR Bypass Token 생성

보안 토큰을 생성한다:

```bash
openssl rand -base64 32
```

### 1.2 환경변수 등록

**로컬 개발 (.env)**

```bash
ISR_BYPASS_TOKEN=생성한-토큰-값
SITE_URL=http://localhost:4321
```

**Vercel 프로덕션**

```bash
# Vercel Dashboard → Settings → Environment Variables
ISR_BYPASS_TOKEN=생성한-토큰-값
SITE_URL=https://your-production-domain.com
```

**Supabase Edge Function**

```bash
# Supabase CLI로 설정
supabase secrets set ISR_BYPASS_TOKEN=생성한-토큰-값
supabase secrets set SITE_URL=https://your-production-domain.com
```

> **중요**: `ISR_BYPASS_TOKEN`은 외부에 노출되면 안 된다. `.env`는 절대 커밋하지 말 것.

---

## 2. Supabase Edge Function 배포

> **전체 가이드**: [`edge-function-setup.md`](./edge-function-setup.md) 참고

### 2.1 간단 요약

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 로그인
supabase login

# 3. 프로젝트 연결
supabase link --project-ref <your-project-id>

# 4. Edge Function 배포
supabase functions deploy revalidate-blog
```

배포 완료 후 Function URL 확인:

```
https://<project-id>.supabase.co/functions/v1/revalidate-blog
```

---

## 3. Supabase Database Webhook 설정

### 3.1 Database Webhooks 활성화

Supabase Dashboard에서:

1. **Database** → **Webhooks** 메뉴로 이동
2. **Enable Webhooks** 클릭 (처음 사용 시)

### 3.2 Webhook 생성

**Create a new hook** 버튼을 클릭하고 다음 정보 입력:

#### 기본 정보

- **Name**: `Revalidate Blog Posts`
- **Table**: `posts`
- **Events**:
  - ✅ `INSERT`
  - ✅ `UPDATE`
  - ✅ `DELETE`

#### HTTP Request 설정

**방법 1: Edge Function 선택 (권장)**

- **Type**: `Supabase Edge Functions`
- **Edge Function**: `revalidate-blog` (드롭다운에서 선택)

**방법 2: HTTP Request**

- **Method**: `POST`
- **URL**: `https://<project-id>.supabase.co/functions/v1/revalidate-blog`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer <anon-key>"
  }
  ```

> **참고**:
>
> - `anon-key`는 Supabase Dashboard → Settings → API에서 확인
> - Payload는 자동으로 생성됨 (수동 설정 불필요)

#### Timeout

- **Timeout**: `5000` (5초)

### 3.3 테스트

1. **Send Test Event** 버튼 클릭
2. 응답이 `200 OK`이고 `success: true`이면 정상

예상 응답:

```json
{
  "success": true,
  "webhookType": "INSERT",
  "revalidated": [
    "https://your-site.com/blog/test-post",
    "https://your-site.com/blog"
  ],
  "timestamp": "2026-03-22T12:00:00.000Z"
}
```

---

## 4. Vercel 배포 및 설정

### 4.1 환경변수 설정

Vercel Dashboard에서:

1. **Project Settings** → **Environment Variables** 메뉴로 이동
2. 다음 환경변수 추가:

| Name               | Value                             | Environment                      |
| ------------------ | --------------------------------- | -------------------------------- |
| `ISR_BYPASS_TOKEN` | 생성한 토큰 값                    | Production, Preview, Development |
| `SITE_URL`         | `https://your-domain.com`         | Production                       |
| `SITE_URL`         | `https://your-preview.vercel.app` | Preview                          |

> **참고**:
>
> - Production URL은 커스텀 도메인 또는 Vercel 도메인
> - Preview는 자동으로 생성되는 URL 사용 (선택사항)
> - Supabase Edge Function의 토큰과 **동일한 값** 사용

### 4.2 배포

```bash
# 프로덕션 배포
vercel --prod
```

배포 완료 후:

- ISR 설정이 활성화됨 (`astro.config.ts:18-24`)
- `/api/revalidate` 엔드포인트가 Serverless Function으로 배포됨

### 4.3 배포 확인

```bash
# 배포된 함수 확인
vercel inspect <deployment-url>

# API 엔드포인트 테스트
curl -X POST https://your-domain.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-post",
    "locale": "ko",
    "bypassToken": "your-token"
  }'
```

예상 응답:

```json
{
  "success": true,
  "revalidated": [
    "https://your-domain.com/blog/test-post",
    "https://your-domain.com/blog"
  ],
  "timestamp": "2026-03-22T12:00:00.000Z"
}
```

---

## 5. 검증 및 테스트

### 5.1 로컬 테스트

```bash
# 개발 서버 실행
pnpm dev

# 별도 터미널에서 API 테스트
curl -X POST http://localhost:4321/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-post",
    "locale": "ko",
    "bypassToken": "로컬-env의-토큰-값"
  }'
```

**예상 응답**:

```json
{
  "success": true,
  "revalidated": [
    "http://localhost:4321/blog/test-post",
    "http://localhost:4321/blog"
  ],
  "timestamp": "2026-03-22T10:30:00.000Z"
}
```

### 5.2 프로덕션 테스트

1. **MCP로 게시글 작성**:

   ```bash
   # Claude Code에서
   mcp__blog-mcp__create-post
   ```

2. **Edge Function 로그 확인**:

   ```bash
   supabase functions logs revalidate-blog --limit 5
   ```

   예상 로그:

   ```
   [Edge Function] Received webhook: { type: "INSERT", slug: "..." }
   [Edge Function] Calling revalidation API for: ko/blog/...
   [Edge Function] Revalidation successful
   ```

3. **Supabase Webhook History 확인**:
   - Database → Webhooks → History
   - 최근 요청의 상태가 `200 OK`인지 확인

4. **사이트에서 확인**:
   - 브라우저에서 해당 게시글 페이지 방문
   - 최신 내용이 반영되었는지 확인

### 5.3 문제 해결

**Edge Function 오류**:

1. **401 Unauthorized** (Webhook → Edge Function):
   - Authorization header 확인
   - anon-key가 올바른지 확인

2. **500 Internal Server Error** (Edge Function):

   ```bash
   # Edge Function 로그 확인
   supabase functions logs revalidate-blog --limit 20
   ```

   - `ISR_BYPASS_TOKEN`, `SITE_URL` secrets 확인
   - Edge Function이 제대로 배포되었는지 확인

3. **401 Unauthorized** (Vercel API):
   - Edge Function의 `ISR_BYPASS_TOKEN`과 Vercel 환경변수 일치 확인
   - Vercel 로그: `vercel logs --follow`

4. **Timeout**:
   - Webhook timeout을 10초로 증가
   - 네트워크 연결 확인

**페이지가 업데이트되지 않는 경우**:

1. **캐시 확인**:

   ```bash
   # 브라우저 하드 리프레시 (Cmd+Shift+R)
   # 또는 시크릿 모드로 접속
   ```

2. **Vercel 배포 확인**:
   - 최신 배포에 ISR 설정이 포함되어 있는지 확인
   - `vercel --prod` 로 재배포

3. **로그 확인**:
   ```bash
   # Vercel Function 로그
   vercel logs --follow
   ```

---

## 6. 비용 및 성능

### 6.1 Vercel ISR 비용

- **무료 티어**: 월 100GB 대역폭, Function 실행 100GB-시간
- **Pro 티어**: 월 1TB 대역폭, Function 실행 1000GB-시간
- **ISR 특성**:
  - 첫 요청 시 재생성 (Function 1회 실행)
  - 이후 요청은 캐시에서 제공 (Function 실행 없음)
  - 게시글 변경이 드물면 비용 효율적

### 6.2 성능 특성

- **첫 방문 (캐시 미스)**: 500-1000ms (DB 쿼리 + Markdown 처리)
- **이후 방문 (캐시 히트)**: 50-100ms (CDN 응답)
- **재생성 시 (무효화 후 첫 요청)**: 500-1000ms
- **동시 접속**: CDN에서 처리하므로 서버 부하 없음

### 6.3 최적화 팁

1. **선택적 무효화**:
   - 게시글 페이지만 무효화 (현재 구현)
   - 목록 페이지는 필요시에만 무효화

2. **Stale-While-Revalidate**:
   - Vercel ISR의 기본 전략
   - 재생성 중에도 이전 버전 제공 (Zero Downtime)

3. **조건부 재생성**:
   - `draft: true` 게시글은 재생성 건너뛰기
   - Webhook에서 조건 확인 가능

---

## 7. 모니터링

### 7.1 Vercel Analytics

Vercel Dashboard에서 확인 가능:

- Function 실행 횟수 및 시간
- ISR 캐시 히트율
- 에러율 및 응답 시간

### 7.2 Supabase Webhook History

Supabase Dashboard → Database → Webhooks → History:

- 각 Webhook 요청의 성공/실패 여부
- 응답 시간 및 상태 코드
- Payload 및 Response 내용

### 7.3 Edge Function 로그

Edge Function 로그 확인:

```bash
# 실시간 로그
supabase functions logs revalidate-blog --follow

# 최근 20개 로그
supabase functions logs revalidate-blog --limit 20
```

### 7.4 Vercel API 로그

Revalidation API 로그 확인:

```bash
# Vercel Serverless Function 로그
vercel logs --follow
```

---

## 참고 자료

- [Vercel ISR 공식 문서](https://vercel.com/docs/incremental-static-regeneration)
- [Astro Vercel Adapter - ISR](https://docs.astro.build/en/guides/integrations-guide/vercel/#isr)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
