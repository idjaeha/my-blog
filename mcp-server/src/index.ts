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

### 구조 (두괄식)
- H1(#)은 사용하지 않는다 (프론트매터 title이 H1 역할)
- H2(##)로 주요 섹션 구분 (글당 5-8개)
- H3(###)은 H2 하위 소주제 (H2당 1-3개)
- 섹션당 150-400 단어 수준으로 유지
- 글의 첫 섹션에 핵심 결론/요약을 먼저 제시한다 (두괄식)
  - 예: "## 결론부터" 또는 "## 핵심 요약" 섹션을 맨 앞에 배치
  - 독자가 전체를 읽지 않아도 핵심을 파악할 수 있어야 한다
  - 이후 섹션에서 배경, 과정, 상세를 풀어간다

### 도입부
- 핵심 결론/해결책을 먼저 제시한 뒤, 배경 맥락을 이어간다
- 개인 경험이나 실제 문제 상황을 짧게 언급한다
- 예: "MongoDB Atlas Private Endpoint는 ENI가 Private Subnet에 있어야 한다. 이 글은 그걸 모르고 삽질한 기록이다."

### 본문
- 문단은 2-4문장 이내로 짧게 유지한다
- "왜(why)"를 먼저 설명하고 "어떻게(how)"를 이어간다
- 비교는 표(table)로, 절차는 번호 목록으로, 대안은 불릿 목록으로 작성한다
- 코드 블록에는 명령어 + 예상 출력을 함께 보여준다
- em dash(—)로 문장 전환을 자연스럽게 연결한다

### 코드 블록 (고급 기능 지원)
블로그는 rehype-pretty-code를 사용하여 다양한 코드 블록 기능을 지원한다:

- 기본 문법:
  \`\`\`언어
  코드 내용
  \`\`\`

- 라인 하이라이트 (특정 라인 강조):
  \`\`\`js {1,3-5}
  const a = 1;  // 1번 라인 하이라이트
  const b = 2;
  const c = 3;  // 3-5번 라인 하이라이트
  const d = 4;
  const e = 5;
  \`\`\`

- 파일명 표시 (헤더에 파일명 표시):
  \`\`\`typescript title="config.ts"
  export default { name: 'app' }
  \`\`\`

- Diff 표시 (추가/삭제 라인):
  \`\`\`js
  const old = 1; // [!code --]
  const new = 2; // [!code ++]
  \`\`\`

- 복합 사용 (여러 기능 조합):
  \`\`\`typescript title="app.ts" {2-4}
  function main() {
    console.log('start');  // 하이라이트
    doSomething();         // 하이라이트
    console.log('end');    // 하이라이트
  }
  \`\`\`

- 라인 번호는 기본적으로 자동 표시됨
- 복사 버튼은 자동으로 추가됨 (호버 시 표시)
- 언어 라벨은 우측 상단에 자동 표시됨

### 특수 블록 (Markdown 문법 — JSX 금지)
이 MCP로 작성하는 글은 Markdown으로 렌더링된다. JSX 컴포넌트(<Callout>, <LinkCard>)는 사용 불가.
대신 아래 Markdown 문법을 사용한다:

- Callout (GFM Alerts):
  > [!WARNING] 제목
  > 내용
  - 지원 타입: NOTE(참고), TIP(팁), WARNING(주의), IMPORTANT(중요), CAUTION(주의)
  - 글당 1-2개 이내, 남용 금지

- Mermaid: 표준 코드블록 사용 (자동 렌더링됨)
  \`\`\`mermaid
  flowchart TB
    A --> B
  \`\`\`
  - 사용 시점: 시스템 아키텍처, 데이터 흐름, 상태 전환, 시퀀스 등 복잡한 관계를 시각화할 때
  - 단순한 목록이나 비교는 표(table)나 불릿 포인트 사용

- 링크: 일반 Markdown 링크 사용 (LinkCard 불가)
  - [글 제목](/blog/slug)

### 마무리
- 글 끝에 별도 "결론" 섹션은 선택사항 (두괄식이므로 서두에 이미 핵심이 있음)
- 비교 글은 "어떤 것을 선택할까" 형태의 판단 기준을 제시한다
- 시리즈 글은 다음 편 링크를 본문 끝에 추가한다
- 참고 자료가 있으면 "참고 자료" 섹션에 링크를 모은다

### 톤
- 반말 기술 문체 (예: "~한다", "~이다")
- 전문적이되 대화하듯 자연스럽게
- 마케팅 표현 금지 ("혁신적인", "완벽한" 등)
- 한국어 기반이되 기술 용어는 영어 그대로 사용

### 메타데이터 규칙 (create-post 필드)
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

// Register all tools using the new registerTool API
const tools = [
  getPostTool,
  listPostsTool,
  createPostTool,
  editPostMetadataTool,
  publishPostTool,
  deletePostTool,
  listTagsTool,
  listCategoriesTool,
];

for (const tool of tools) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema.shape,
    },
    tool.handler,
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("blog-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
