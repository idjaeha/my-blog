/**
 * Static validation for blog post content before saving to Supabase.
 * Returns an array of error messages. Empty array = valid.
 */

const VALID_CATEGORIES = [
  "til",
  "retrospective",
  "article",
  "tutorial",
  "infra",
];

const JSX_PATTERNS = [
  { pattern: /<Callout[\s>]/g, name: "<Callout>" },
  { pattern: /<LinkCard[\s>]/g, name: "<LinkCard>" },
  { pattern: /<MermaidDiagram[\s>]/g, name: "<MermaidDiagram>" },
  { pattern: /import\s+.*from\s+['"]@?\//g, name: "import statement" },
  { pattern: /<[A-Z][a-zA-Z]*[\s/>]/g, name: "JSX component" },
];

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface ValidatePostInput {
  slug?: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  body?: string;
}

export function validatePost(input: ValidatePostInput): string[] {
  const errors: string[] = [];

  // Metadata validation
  if (input.slug !== undefined) {
    if (!SLUG_PATTERN.test(input.slug)) {
      errors.push(
        `slug: 소문자 영어와 하이픈만 사용 가능 (예: "my-first-post"), 현재: "${input.slug}"`,
      );
    }
  }

  if (input.title !== undefined) {
    if (input.title.length > 100) {
      errors.push(`title: 100자 이내여야 함 (현재 ${input.title.length}자)`);
    }
    if (input.title.trim().length === 0) {
      errors.push("title: 비어있음");
    }
  }

  if (input.description !== undefined) {
    if (input.description.length > 300) {
      errors.push(
        `description: 300자 이내여야 함 (현재 ${input.description.length}자)`,
      );
    }
    if (input.description.trim().length === 0) {
      errors.push("description: 비어있음");
    }
  }

  if (input.category !== undefined) {
    if (!VALID_CATEGORIES.includes(input.category)) {
      errors.push(
        `category: "${input.category}"은 유효하지 않음. 가능한 값: ${VALID_CATEGORIES.join(", ")}`,
      );
    }
  }

  if (input.tags !== undefined) {
    if (input.tags.length > 7) {
      errors.push(`tags: 최대 7개 (현재 ${input.tags.length}개)`);
    }
    for (const tag of input.tags) {
      if (tag !== tag.toLowerCase() || tag.includes(" ")) {
        errors.push(
          `tags: "${tag}"은 소문자 하이픈 형식이어야 함 (예: "my-tag")`,
        );
      }
    }
  }

  // Body content validation
  if (input.body) {
    errors.push(...validateBody(input.body));
  }

  return errors;
}

function validateBody(body: string): string[] {
  const errors: string[] = [];
  const lines = body.split("\n");

  // Check for JSX components (not allowed in Supabase/Markdown posts)
  for (const { pattern, name } of JSX_PATTERNS) {
    const matches = body.match(pattern);
    if (matches) {
      errors.push(
        `body: ${name} 사용 불가 — Supabase 글은 Markdown만 지원. ` +
          (name === "<Callout>"
            ? "대신 GFM Alert 사용: > [!WARNING] 제목"
            : name === "<MermaidDiagram>"
              ? "대신 ```mermaid 코드블록 사용"
              : name === "<LinkCard>"
                ? "대신 일반 Markdown 링크 사용: [제목](url)"
                : "JSX 컴포넌트 대신 Markdown 문법 사용"),
      );
    }
  }

  // Check heading hierarchy
  let hasH1 = false;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      hasH1 = true;
      break;
    }
  }
  if (hasH1) {
    errors.push(
      "body: H1(#) 사용 금지 — 제목은 title 필드에 입력, 본문은 H2(##)부터 시작",
    );
  }

  // Check for unclosed mermaid code blocks by tracking open/close state
  let insideCodeBlock = false;
  let unclosedMermaid = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!insideCodeBlock && trimmed.startsWith("```")) {
      insideCodeBlock = true;
      if (trimmed.startsWith("```mermaid")) {
        unclosedMermaid++;
      }
    } else if (insideCodeBlock && trimmed === "```") {
      insideCodeBlock = false;
      if (unclosedMermaid > 0) unclosedMermaid--;
    }
  }
  if (unclosedMermaid > 0) {
    errors.push("body: 닫히지 않은 mermaid 코드블록이 있음");
  }

  return errors;
}
