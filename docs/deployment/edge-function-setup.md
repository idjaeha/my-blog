# Supabase Edge Function 배포 가이드

## 개요

Supabase Database Webhook과 Vercel ISR을 연결하는 Edge Function을 배포하는 가이드다.

### 아키텍처

```
Supabase DB (posts 테이블 변경)
  ↓
Database Webhook (자동 payload)
  ↓
Edge Function (revalidate-blog)
  - 환경변수에서 ISR_BYPASS_TOKEN 가져오기
  - slug, locale 추출
  - draft 게시글 필터링
  ↓
Vercel Revalidation API (/api/revalidate)
  ↓
페이지 재생성
```

---

## 1. Supabase CLI 설치

### 1.1 CLI 설치

```bash
# npm을 사용하는 경우
npm install -g supabase

# 또는 Homebrew (macOS/Linux)
brew install supabase/tap/supabase
```

### 1.2 로그인

```bash
supabase login
```

브라우저가 열리고 Supabase 계정으로 로그인한다.

---

## 2. 프로젝트 연결

### 2.1 프로젝트 ID 확인

Supabase Dashboard에서:

1. **Project Settings** → **General**
2. **Reference ID** 복사

### 2.2 프로젝트 연결

```bash
# 프로젝트 루트에서 실행
cd /Users/jaehayi/Programming/my-blog

# Supabase 프로젝트와 연결
supabase link --project-ref <your-project-id>
```

프롬프트가 나타나면 데이터베이스 비밀번호를 입력한다.

---

## 3. Edge Function 배포

### 3.1 환경변수 설정

Edge Function에서 사용할 secret 설정:

```bash
# ISR Bypass Token 설정
supabase secrets set ISR_BYPASS_TOKEN=<your-bypass-token>

# 프로덕션 사이트 URL 설정
supabase secrets set SITE_URL=https://your-production-domain.com
```

> **참고**: `.env` 파일에 있는 `ISR_BYPASS_TOKEN` 값을 사용한다.

### 3.2 Function 배포

```bash
# revalidate-blog function 배포
supabase functions deploy revalidate-blog
```

배포가 완료되면 Function URL이 출력된다:

```
https://<project-id>.supabase.co/functions/v1/revalidate-blog
```

이 URL을 복사해둔다.

### 3.3 배포 확인

```bash
# 배포된 함수 목록 확인
supabase functions list

# 함수 로그 확인 (실시간)
supabase functions logs revalidate-blog --follow
```

---

## 4. Database Webhook 설정

### 4.1 Webhook 생성

Supabase Dashboard에서:

1. **Database** → **Webhooks** 메뉴로 이동
2. **Enable Webhooks** 클릭 (처음 사용 시)
3. **Create a new hook** 클릭

### 4.2 Webhook 설정

#### 기본 정보

- **Name**: `Revalidate Blog Posts`
- **Table**: `posts`
- **Events**:
  - ✅ `INSERT`
  - ✅ `UPDATE`
  - ✅ `DELETE`

#### HTTP Request 설정

- **Type**: `Supabase Edge Functions`
- **Edge Function**: `revalidate-blog` (드롭다운에서 선택)

또는 HTTP Request 방식:

- **Method**: `POST`
- **URL**: `https://<project-id>.supabase.co/functions/v1/revalidate-blog`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer <anon-key>"
  }
  ```

> **참고**: `anon-key`는 Supabase Dashboard → Settings → API에서 확인 가능

#### Timeout

- **Timeout**: `5000` (5초)

### 4.3 테스트

1. **Send Test Event** 버튼 클릭
2. 응답이 `200 OK`이고 `success: true`이면 정상

---

## 5. 로컬 테스트 (선택사항)

Edge Function을 로컬에서 테스트할 수 있다.

### 5.1 로컬 환경변수 설정

`.env.local` 파일 생성:

```bash
# supabase/functions/.env.local
ISR_BYPASS_TOKEN=<your-local-bypass-token>
SITE_URL=http://localhost:4321
```

### 5.2 로컬 서버 실행

```bash
# Supabase 로컬 개발 환경 시작
supabase start

# Edge Function 로컬 실행
supabase functions serve revalidate-blog --env-file supabase/functions/.env.local
```

### 5.3 로컬 테스트

```bash
# 테스트 요청 (Supabase Webhook payload 형식)
curl -X POST http://localhost:54321/functions/v1/revalidate-blog \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "posts",
    "schema": "public",
    "record": {
      "slug": "test-post",
      "locale": "ko",
      "draft": false
    },
    "old_record": null
  }'
```

**예상 응답**:

```json
{
  "success": true,
  "webhookType": "INSERT",
  "revalidated": [
    "http://localhost:4321/blog/test-post",
    "http://localhost:4321/blog"
  ],
  "timestamp": "2026-03-22T12:00:00.000Z"
}
```

---

## 6. 검증 및 모니터링

### 6.1 Edge Function 로그 확인

```bash
# 실시간 로그 확인
supabase functions logs revalidate-blog --follow

# 최근 로그 조회
supabase functions logs revalidate-blog --limit 20
```

### 6.2 Webhook History 확인

Supabase Dashboard → Database → Webhooks → History:

- 각 Webhook 요청의 성공/실패 여부
- 응답 시간 및 상태 코드
- Request/Response 내용

### 6.3 통합 테스트

1. **MCP로 게시글 작성**:

   ```bash
   # Claude Code에서
   mcp__blog-mcp__create-post
   ```

2. **Webhook 트리거 확인**:
   - Supabase Dashboard → Database → Webhooks → History
   - 최근 요청이 `200 OK`인지 확인

3. **Edge Function 로그 확인**:

   ```bash
   supabase functions logs revalidate-blog --limit 5
   ```

   로그에서 다음 메시지 확인:

   ```
   [Edge Function] Received webhook: { type: "INSERT", ... }
   [Edge Function] Calling revalidation API for: ko/blog/...
   [Edge Function] Revalidation successful: { success: true, ... }
   ```

4. **사이트에서 확인**:
   - 브라우저에서 해당 게시글 페이지 방문
   - 최신 내용이 반영되었는지 확인

---

## 7. 문제 해결

### 7.1 배포 실패

**에러**: `Error: Project is not linked`

```bash
# 프로젝트 다시 연결
supabase link --project-ref <your-project-id>
```

**에러**: `Error: Missing required environment variables`

```bash
# Secrets가 제대로 설정되었는지 확인
supabase secrets list

# 없으면 다시 설정
supabase secrets set ISR_BYPASS_TOKEN=<token>
supabase secrets set SITE_URL=<url>
```

### 7.2 Webhook 실패

**401 Unauthorized**:

- Edge Function이 제대로 배포되었는지 확인
- Authorization header가 올바른지 확인

**500 Internal Server Error**:

- Edge Function 로그 확인:
  ```bash
  supabase functions logs revalidate-blog --limit 10
  ```
- 환경변수가 올바르게 설정되었는지 확인

**Timeout**:

- Webhook timeout을 10초로 증가
- Vercel API 응답 시간 확인

### 7.3 페이지가 업데이트되지 않음

1. **Edge Function이 호출되었는지 확인**:

   ```bash
   supabase functions logs revalidate-blog
   ```

2. **Vercel Revalidation API가 정상 작동하는지 확인**:

   ```bash
   vercel logs --follow
   ```

3. **캐시 문제**:
   - 브라우저 하드 리프레시 (Cmd+Shift+R)
   - 시크릿 모드로 접속

---

## 8. Edge Function 업데이트

코드를 수정한 후 재배포:

```bash
# 변경사항 저장 후
supabase functions deploy revalidate-blog

# 배포 확인
supabase functions list
```

> **참고**: Secrets는 재배포 시에도 유지된다.

---

## 9. 비용

### Supabase Edge Functions

- **무료 티어**: 월 500K 함수 호출, 400K GB-초
- **Pro 티어**: 월 2M 함수 호출, 2M GB-초
- 게시글 변경이 드물면 무료 티어로 충분함

### 예상 사용량

- 게시글 1개 추가/수정: 함수 호출 1회
- 월 30개 게시글 작성: 30회 호출
- 여유있게 무료 티어 범위 내

---

## 참고 자료

- [Supabase Edge Functions 공식 문서](https://supabase.com/docs/guides/functions)
- [Supabase CLI 참조](https://supabase.com/docs/reference/cli/introduction)
- [Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Deno 공식 문서](https://deno.land/manual)
