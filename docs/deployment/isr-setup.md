# ISR (Incremental Static Regeneration) 설정 가이드

## 개요

Supabase에 게시글을 추가/수정하면 자동으로 해당 페이지가 무효화되고 재생성되는 On-Demand Revalidation 시스템이다.

### 작동 원리

1. **초기 빌드**: Vercel에 배포 시 모든 블로그 페이지를 정적으로 생성
2. **CDN 캐싱**: 생성된 페이지는 Vercel Edge Network에 캐싱됨
3. **변경 감지**: Supabase의 `posts` 테이블에 변경 발생 (INSERT/UPDATE/DELETE)
4. **Webhook 트리거**: Database Webhook이 `/api/revalidate` 엔드포인트 호출
5. **무효화 요청**: API가 Vercel에 해당 페이지 재생성 요청
6. **재생성**: 다음 방문 시 최신 데이터로 페이지 재생성

---

## 1. 환경변수 설정

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

> **중요**: `ISR_BYPASS_TOKEN`은 외부에 노출되면 안 된다. `.env`는 절대 커밋하지 말 것.

---

## 2. Supabase Database Webhook 설정

### 2.1 Database Webhooks 활성화

Supabase Dashboard에서:

1. **Database** → **Webhooks** 메뉴로 이동
2. **Enable Webhooks** 클릭 (처음 사용 시)

### 2.2 Webhook 생성

**New Webhook** 버튼을 클릭하고 다음 정보 입력:

#### 기본 정보

- **Name**: `Revalidate Blog Posts`
- **Table**: `posts`
- **Events**:
  - ✅ `INSERT`
  - ✅ `UPDATE`
  - ✅ `DELETE`

#### HTTP Request 설정

- **Method**: `POST`
- **URL**: `https://your-production-domain.com/api/revalidate`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

#### Request Body (Payload)

변경된 레코드의 slug를 전달하도록 설정:

```json
{
  "slug": "{{ record.slug }}",
  "locale": "{{ record.locale }}",
  "bypassToken": "여기에-ISR_BYPASS_TOKEN-값-입력"
}
```

> **주의**: `bypassToken`에 실제 토큰 값을 직접 입력해야 한다. Supabase Webhook은 환경변수를 지원하지 않는다.

#### Timeout

- **Timeout**: `5000` (5초)

### 2.3 테스트

1. Webhook 저장 후 **Test** 버튼 클릭
2. Sample payload를 확인하고 **Send Test Request**
3. 응답이 `200 OK`이고 `success: true`이면 정상

---

## 3. Edge Function을 통한 보안 강화 (선택사항)

Webhook payload에 토큰을 직접 넣는 대신, Supabase Edge Function을 사용하여 토큰을 서버 측에서 관리할 수 있다.

### 3.1 Edge Function 생성

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 초기화
supabase init

# Edge Function 생성
supabase functions new revalidate-blog
```

### 3.2 Function 코드 작성

**supabase/functions/revalidate-blog/index.ts**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { record } = await req.json();

    // Supabase Secret에서 토큰 가져오기
    const bypassToken = Deno.env.get("ISR_BYPASS_TOKEN");
    const siteUrl = Deno.env.get("SITE_URL");

    if (!bypassToken || !siteUrl) {
      throw new Error("Missing environment variables");
    }

    // Revalidation API 호출
    const response = await fetch(`${siteUrl}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: record.slug,
        locale: record.locale,
        bypassToken,
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### 3.3 Secrets 설정

```bash
supabase secrets set ISR_BYPASS_TOKEN=생성한-토큰-값
supabase secrets set SITE_URL=https://your-production-domain.com
```

### 3.4 Function 배포

```bash
supabase functions deploy revalidate-blog
```

### 3.5 Webhook URL 변경

Database Webhook의 URL을:

```
https://your-project.supabase.co/functions/v1/revalidate-blog
```

로 변경하고, payload에서 `bypassToken` 제거.

---

## 4. 검증 및 테스트

### 4.1 로컬 테스트

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

### 4.2 프로덕션 테스트

1. **MCP로 게시글 작성**:

   ```bash
   # Claude Code에서
   mcp__blog-mcp__create-post
   ```

2. **Supabase Dashboard 확인**:
   - Database → Webhooks → History
   - 최근 요청의 상태가 `200 OK`인지 확인

3. **사이트에서 확인**:
   - 브라우저에서 해당 게시글 페이지 새로고침
   - 최신 내용이 반영되었는지 확인

### 4.3 문제 해결

**Webhook이 실패하는 경우**:

1. **401 Unauthorized**:
   - Webhook payload의 `bypassToken`이 Vercel 환경변수와 일치하는지 확인

2. **500 Internal Server Error**:
   - Vercel 로그 확인: `vercel logs`
   - Revalidation API의 에러 로그 확인

3. **Timeout**:
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

## 5. 비용 및 성능

### 5.1 Vercel ISR 비용

- **무료 티어**: 월 100GB 대역폭, Function 실행 100GB-시간
- **Pro 티어**: 월 1TB 대역폭, Function 실행 1000GB-시간
- **ISR 특성**:
  - 첫 요청 시 재생성 (Function 1회 실행)
  - 이후 요청은 캐시에서 제공 (Function 실행 없음)
  - 게시글 변경이 드물면 비용 효율적

### 5.2 성능 특성

- **첫 방문 (캐시 미스)**: 500-1000ms (DB 쿼리 + Markdown 처리)
- **이후 방문 (캐시 히트)**: 50-100ms (CDN 응답)
- **재생성 시 (무효화 후 첫 요청)**: 500-1000ms
- **동시 접속**: CDN에서 처리하므로 서버 부하 없음

### 5.3 최적화 팁

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

## 6. 모니터링

### 6.1 Vercel Analytics

Vercel Dashboard에서 확인 가능:

- Function 실행 횟수 및 시간
- ISR 캐시 히트율
- 에러율 및 응답 시간

### 6.2 Supabase Webhook History

Supabase Dashboard → Database → Webhooks → History:

- 각 Webhook 요청의 성공/실패 여부
- 응답 시간 및 상태 코드
- Payload 및 Response 내용

### 6.3 커스텀 로깅

Revalidation API에 이미 포함된 로깅:

```typescript
console.log(`[Revalidate] Requesting revalidation for: ${pageUrl}`);
```

Vercel 로그에서 확인:

```bash
vercel logs --follow
```

---

## 참고 자료

- [Vercel ISR 공식 문서](https://vercel.com/docs/incremental-static-regeneration)
- [Astro Vercel Adapter - ISR](https://docs.astro.build/en/guides/integrations-guide/vercel/#isr)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
