# 카테고리 클릭 시 필터 미동작

## 증상

`/blog` 페이지에서 카테고리를 클릭하면 `?category=til` 쿼리 파라미터가 URL에 추가되지만 포스트 목록이 필터링되지 않는다.

## 원인

`output: "static"` 빌드에서 `Astro.url.searchParams`는 빌드 타임에 항상 비어있다. 정적 사이트이므로 서버 사이드에서 쿼리 파라미터 기반 필터링이 불가능하다.

## 해결

클라이언트 사이드 JS로 필터링을 구현했다.

1. `PostList.astro`에서 각 포스트 카드를 `<div data-category={post.category}>`로 감싸 필터링 대상 마킹
2. `CategoryFilter.astro`에 `<script>`를 추가하여 클릭 시 `data-category`로 DOM 요소 표시/숨김 처리
3. URL에 `?category=` 쿼리 파라미터를 `history.replaceState`로 반영하여 새로고침 시 상태 유지

```typescript
// CategoryFilter.astro <script>
buttons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    setActive(btn.dataset.category ?? "all");
  });
});

// 초기 로드 시 URL에서 카테고리 복원
const initialCategory =
  new URL(window.location.href).searchParams.get("category") ?? "all";
setActive(initialCategory);
```

## 관련 파일

- `src/components/blog/CategoryFilter.astro`
- `src/components/blog/PostList.astro`
