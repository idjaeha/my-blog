# Tailwind CSS v4 + `@tailwindcss/typography` 플러그인 에러

## 증상

```
TypeError: Cannot read properties of undefined (reading 'call')
    at EnvironmentPluginContainer.transform
```

`@tailwindcss/typography` 설치 후 `globals.css`에 `@plugin "@tailwindcss/typography"`를 추가하면 dev 서버에서 에러 발생. 빌드는 성공하지만 `astro dev`에서 실패한다.

## 원인

`@tailwindcss/typography` 플러그인이 Tailwind CSS v4 + Vite 7 dev 서버의 `EnvironmentPluginContainer` transform 훅과 호환성 문제를 일으킨다.

## 해결

플러그인 의존 없이 `globals.css`에 커스텀 타이포그래피 스타일(`.mdx-content`)을 직접 작성. 프로젝트의 CSS 변수(`--foreground`, `--border`, `--muted` 등)를 활용하여 다크모드도 자동 지원된다.

## 변경된 파일

- `src/styles/globals.css` — `.mdx-content` 스타일 추가
- `src/layouts/BlogPostLayout.astro` — `prose` → `mdx-content`
- `src/pages/about.astro`, `src/pages/en/about.astro` — `prose` → `mdx-content`
- `src/components/islands/TableOfContents.tsx` — `.prose` 셀렉터 → `.mdx-content`
