# Mermaid 다이어그램 SVG 파싱 에러

## 증상

```
This page contains the following errors:
error on line 1 at column 12812: Opening and ending tag mismatch: br line 1 and p
```

Mermaid 차트에 `\n`(줄바꿈)을 포함한 노드 텍스트를 사용하면 렌더링 시 에러가 발생한다.

```
graph LR
  H[Host App\nClaude / Cursor]
```

## 원인

Mermaid 라이브러리가 `\n`을 SVG 내부에서 `<br>` 태그로 변환한다. `MermaidDiagram.tsx`에서 `DOMParser`가 이 SVG를 `"image/svg+xml"` (XML 모드)로 파싱하는데, XML에서는 `<br>`이 유효하지 않다 (자체 닫힘 `<br/>`이어야 함).

## 해결

`mermaid.render()` 결과의 SVG 문자열에서 `<br>`을 `<br/>`로 치환한 후 파싱한다.

```typescript
const { svg } = await mermaid.render(id, chart);
const sanitizedSvg = svg.replace(/<br\s*(?!\/)>/gi, "<br/>");
const doc = parser.parseFromString(sanitizedSvg, "image/svg+xml");
```

이 방어 로직이 렌더링 시점에서 동작하므로, MCP를 통해 Mermaid 차트가 포함된 글을 작성해도 동일한 에러가 재발하지 않는다.

## 관련 파일

- `src/components/mdx/MermaidDiagram.tsx`
