# LinkCard 컴포넌트 `Invalid URL` 에러

## 증상

```
TypeError: Invalid URL
    at new URL (node:internal/url:818:25)
    at LinkCard (src/components/mdx/LinkCard.tsx:20:11)
```

MDX 파일에서 `LinkCard`에 상대 경로(예: `/blog/mcp-deep-dive-2-json-rpc`)를 전달하면 빌드/렌더링 시 에러가 발생한다.

## 원인

`new URL(href).hostname`에서 `href`가 절대 URL(`https://...`)이 아닌 상대 경로(`/blog/...`)일 경우, base URL 없이는 유효한 URL로 파싱할 수 없어 `TypeError`가 발생한다.

## 해결

- `href`가 `http(s)://`로 시작하는 외부 링크인 경우에만 hostname을 표시하고 `target="_blank"` 적용
- 상대 경로(내부 링크)인 경우 hostname을 숨기고 같은 탭에서 이동
- `try/catch`로 URL 파싱 실패도 방어

```typescript
const isExternal = /^https?:\/\//.test(href);
let hostname: string | null = null;
if (isExternal) {
  try {
    hostname = new URL(href).hostname;
  } catch {
    // invalid URL — skip hostname display
  }
}
```

## 관련 파일

- `src/components/mdx/LinkCard.tsx`
