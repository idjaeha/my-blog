import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getPostTool } from "./tools/get-post.js";
import { listPostsTool } from "./tools/list-posts.js";
import { createPostTool } from "./tools/create-post.js";
import { editPostMetadataTool } from "./tools/edit-post-metadata.js";
import { publishPostTool } from "./tools/publish-post.js";
import { deletePostTool } from "./tools/delete-post.js";
import { listTagsTool } from "./tools/list-tags.js";
import { listCategoriesTool } from "./tools/list-categories.js";

const WRITING_GUIDELINES = `재하의 개발 블로그 콘텐츠 관리 서버.
Supabase에 저장된 블로그 게시물을 CRUD하는 도구를 제공한다.

## 글쓰기 규칙

### 구조
- H1(#)은 사용하지 않는다 (프론트매터 title이 H1 역할)
- H2(##)로 주요 섹션 구분 (글당 5-8개)
- H3(###)은 H2 하위 소주제 (H2당 1-3개)
- 섹션당 150-400 단어 수준으로 유지

### 도입부
- 개인 경험이나 실제 문제 상황으로 시작한다
- 추상적 정의가 아닌 구체적 맥락을 먼저 제시한다
- 예: "프로젝트에서 Git hooks를 설정하다가 이상한 문제를 만났다..."

### 본문
- 문단은 2-4문장 이내로 짧게 유지한다
- "왜(why)"를 먼저 설명하고 "어떻게(how)"를 이어간다
- 비교는 표(table)로, 절차는 번호 목록으로, 대안은 불릿 목록으로 작성한다
- 코드 블록에는 명령어 + 예상 출력을 함께 보여준다
- em dash(—)로 문장 전환을 자연스럽게 연결한다

### MDX 컴포넌트
- Callout: 중요 경고/팁에만 사용 (글당 1-2개 이내, 남용 금지)
  - type: "warning" | "info" | "tip"
  - 예: <Callout type="warning" title="흔한 실수">내용</Callout>
- Mermaid: 아키텍처/흐름 시각화에 사용 (장식이 아닌 이해 보조 목적)
  - flowchart TB/LR, sequenceDiagram 등
- LinkCard: 시리즈 연결이나 관련 글 참조에 사용 (글 끝부분)

### 마무리
- "정리" 또는 "결론" 섹션으로 핵심을 요약한다
- 비교 글은 "어떤 것을 선택할까" 형태의 판단 기준을 제시한다
- 시리즈 글은 LinkCard로 다음 편을 연결한다
- 참고 자료가 있으면 "참고 자료" 섹션에 링크를 모은다

### 톤
- 반말 기술 문체 (예: "~한다", "~이다")
- 전문적이되 대화하듯 자연스럽게
- 마케팅 표현 금지 ("혁신적인", "완벽한" 등)
- 한국어 기반이되 기술 용어는 영어 그대로 사용

### 프론트매터 규칙
- title: 핵심 키워드를 앞에, em dash(—)로 부연 설명 연결 (100자 이내)
- description: 2-3문장, 글의 동기와 핵심 내용 요약 (300자 이내)
- category: "til" | "retrospective" | "article" | "tutorial" | "infra"
  - til: 짧은 팁/해결법, article: 개념 심층 분석, infra: 인프라/네트워크
  - tutorial: 단계별 가이드, retrospective: 프로젝트 회고
- tags: 소문자 하이픈 구분, 3-7개 (예: ["aws", "private-endpoint", "mongodb"])
- slug: 소문자 하이픈, 영어 (예: "volta-vs-nvm-comparison")`;

const server = new McpServer(
  { name: "blog-mcp", version: "0.2.0" },
  { instructions: WRITING_GUIDELINES },
);

// Register all tools
server.tool(
  getPostTool.name,
  getPostTool.description,
  getPostTool.inputSchema.shape,
  getPostTool.handler,
);

server.tool(
  listPostsTool.name,
  listPostsTool.description,
  listPostsTool.inputSchema.shape,
  listPostsTool.handler,
);

server.tool(
  createPostTool.name,
  createPostTool.description,
  createPostTool.inputSchema.shape,
  createPostTool.handler,
);

server.tool(
  editPostMetadataTool.name,
  editPostMetadataTool.description,
  editPostMetadataTool.inputSchema.shape,
  editPostMetadataTool.handler,
);

server.tool(
  publishPostTool.name,
  publishPostTool.description,
  publishPostTool.inputSchema.shape,
  publishPostTool.handler,
);

server.tool(
  deletePostTool.name,
  deletePostTool.description,
  deletePostTool.inputSchema.shape,
  deletePostTool.handler,
);

server.tool(
  listTagsTool.name,
  listTagsTool.description,
  listTagsTool.inputSchema.shape,
  listTagsTool.handler,
);

server.tool(
  listCategoriesTool.name,
  listCategoriesTool.description,
  listCategoriesTool.inputSchema.shape,
  listCategoriesTool.handler,
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("blog-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
