# 블로그 글 작성 가이드

## 파일 위치

```
src/content/blog/
├── ko/[slug].mdx    # 한국어
└── en/[slug].mdx    # 영어
```

slug는 URL에 사용되므로 영문 소문자, 하이픈으로 작성한다 (예: `github-multi-account-ssh`).

## 프론트매터

```yaml
---
title: "제목" # 필수, 최대 100자
description: "설명" # 필수, 최대 300자
category: "article" # 필수, 아래 4개 중 택 1
tags: ["tag1", "tag2"] # 선택, 기본값 []
publishedDate: 2026-03-15 # 필수
updatedDate: 2026-03-16 # 선택, 수정 시 추가
draft: false # 선택, 기본값 false
coverImage: "/og/..." # 선택
series: "시리즈명" # 선택
seriesOrder: 1 # 선택, series와 함께 사용
---
```

### 카테고리

| 값              | 한국어   | 영어          | 용도           |
| --------------- | -------- | ------------- | -------------- |
| `til`           | TIL      | TIL           | 짧은 학습 기록 |
| `retrospective` | 회고     | Retrospective | 프로젝트 회고  |
| `article`       | 아티클   | Article       | 기술 아티클    |
| `tutorial`      | 튜토리얼 | Tutorial      | 단계별 가이드  |

## MDX 컴포넌트

사용 가능한 컴포넌트와 import 방법:

### Callout

```mdx
import Callout from "@/components/mdx/Callout";

<Callout type="info" title="제목">
  본문 내용
</Callout>
```

type: `info`, `warning`, `danger`, `tip`

### LinkCard

```mdx
import LinkCard from "@/components/mdx/LinkCard";

<!-- 외부 링크 (hostname 표시, 새 탭) -->

<LinkCard href="https://example.com" title="제목" description="설명" />

<!-- 내부 링크 (같은 탭) -->

<LinkCard href="/blog/other-post" title="제목" description="설명" />
```

### MermaidDiagram

```mdx
import MermaidDiagram from "@/components/mdx/MermaidDiagram";

<MermaidDiagram
  client:visible
  chart={`graph LR
    A[Start] --> B[End]`}
/>
```

`client:visible` 디렉티브 필수. 노드 텍스트에 `\n` 사용 가능 (줄바꿈).

### Image

```mdx
import Image from "@/components/mdx/Image.astro";
```

### CodeBlock

```mdx
import CodeBlock from "@/components/mdx/CodeBlock";
```

## 시리즈 글

시리즈에 속하는 글은 `series`와 `seriesOrder`를 지정한다. 마지막 글에 다음 편 LinkCard를 추가하는 패턴을 사용한다.

```yaml
series: "MCP 완전 정복"
seriesOrder: 1
```

## 작성 후 확인

1. `pnpm build` — 빌드 에러 없는지 확인
2. `pnpm dev` — 브라우저에서 렌더링 확인
