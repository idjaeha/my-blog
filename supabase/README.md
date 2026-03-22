# Supabase Edge Functions

이 디렉토리에는 Supabase Edge Functions가 포함되어 있습니다.

## Functions

### revalidate-blog

Supabase Database Webhook과 Vercel ISR을 연결하는 함수입니다.

**용도**:

- `posts` 테이블의 INSERT/UPDATE/DELETE 이벤트 감지
- Vercel Revalidation API 호출하여 페이지 재생성

**배포 방법**:

```bash
supabase functions deploy revalidate-blog
```

**자세한 가이드**: [`../docs/deployment/edge-function-setup.md`](../docs/deployment/edge-function-setup.md)

## 환경변수

Edge Function에서 사용하는 secrets:

```bash
# ISR Bypass Token
supabase secrets set ISR_BYPASS_TOKEN=<token>

# 프로덕션 사이트 URL
supabase secrets set SITE_URL=https://your-site.com
```

## 로컬 개발

```bash
# 로컬 환경변수 설정
echo "ISR_BYPASS_TOKEN=<token>" > functions/.env.local
echo "SITE_URL=http://localhost:4321" >> functions/.env.local

# 로컬 실행
supabase functions serve revalidate-blog --env-file functions/.env.local
```

## 테스트

```bash
# 로컬 테스트
curl -X POST http://localhost:54321/functions/v1/revalidate-blog \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "posts",
    "schema": "public",
    "record": {
      "slug": "test-post",
      "locale": "ko"
    },
    "old_record": null
  }'
```

## 로그 확인

```bash
# 실시간 로그
supabase functions logs revalidate-blog --follow

# 최근 로그
supabase functions logs revalidate-blog --limit 20
```
