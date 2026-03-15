# 카테고리가 하드코딩되어 동적으로 생성되지 않음

## 증상

포스트가 없는 카테고리도 카테고리 필터에 항상 표시된다.

## 원인

`astro-loader.ts`의 `getAllCategories()`가 하드코딩된 배열을 반환한다.

```typescript
// Before
async getAllCategories(): Promise<string[]> {
  return ["til", "retrospective", "article", "tutorial"];
}
```

## 해결

실제 포스트에서 카테고리를 추출하도록 변경. `locale` 파라미터를 추가하여 해당 로케일의 포스트에서 사용 중인 카테고리만 반환한다.

```typescript
// After
async getAllCategories(locale: string = "ko"): Promise<string[]> {
  const posts = await this.getAllPosts(locale);
  const categories = new Set(posts.map((p) => p.category));
  return [...categories].sort();
}
```

`CategoryFilter.astro`도 `CATEGORIES` 상수 전체를 순회하는 대신, `contentService.getAllCategories(locale)`로 실제 포스트가 있는 카테고리만 표시하도록 변경했다.

## 관련 파일

- `src/lib/content/astro-loader.ts`
- `src/lib/content/types.ts`
- `src/components/blog/CategoryFilter.astro`
