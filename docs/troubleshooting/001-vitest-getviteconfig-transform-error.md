# Vitest + Astro `getViteConfig` 에러

## 증상

```
TypeError: Cannot read properties of undefined (reading 'call')
    at EnvironmentPluginContainer.transform
```

## 원인

`vitest.config.ts`에서 Astro의 `getViteConfig`를 사용하면 `astro.config.ts`에 등록된 Vite 플러그인(tailwindcss 등)이 테스트 환경에도 로드된다. 이 플러그인들의 `transform` 훅이 테스트 컨텍스트에서는 초기화되지 않아 `undefined.call()` 에러가 발생한다.

## 해결

`vitest/config`의 `defineConfig`로 교체. 테스트에는 Astro/Tailwind 플러그인이 필요 없고 `@/` alias만 설정하면 충분하다.

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
    exclude: ["tests/integration/**"],
  },
});
```

## 관련 파일

- `vitest.config.ts`
