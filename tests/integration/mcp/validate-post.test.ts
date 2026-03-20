import { describe, it, expect } from "vitest";
import { validatePost } from "../../../mcp-server/src/utils/validate-post.js";

describe("validatePost", () => {
  describe("slug", () => {
    it("passes valid slug", () => {
      expect(validatePost({ slug: "my-first-post" })).toEqual([]);
    });

    it("passes single-word slug", () => {
      expect(validatePost({ slug: "hello" })).toEqual([]);
    });

    it("rejects uppercase slug", () => {
      const errors = validatePost({ slug: "My-Post" });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("소문자");
    });

    it("rejects slug with spaces", () => {
      const errors = validatePost({ slug: "my post" });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("소문자");
    });

    it("rejects slug with underscores", () => {
      const errors = validatePost({ slug: "my_post" });
      expect(errors).toHaveLength(1);
    });

    it("rejects slug starting with hyphen", () => {
      const errors = validatePost({ slug: "-my-post" });
      expect(errors).toHaveLength(1);
    });

    it("rejects slug ending with hyphen", () => {
      const errors = validatePost({ slug: "my-post-" });
      expect(errors).toHaveLength(1);
    });
  });

  describe("title", () => {
    it("passes valid title", () => {
      expect(validatePost({ title: "My Post Title" })).toEqual([]);
    });

    it("rejects title over 100 chars", () => {
      const errors = validatePost({ title: "a".repeat(101) });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("100자");
    });

    it("passes title at exactly 100 chars", () => {
      expect(validatePost({ title: "a".repeat(100) })).toEqual([]);
    });

    it("rejects empty title", () => {
      const errors = validatePost({ title: "   " });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("비어있음");
    });
  });

  describe("description", () => {
    it("passes valid description", () => {
      expect(validatePost({ description: "A good description" })).toEqual([]);
    });

    it("rejects description over 300 chars", () => {
      const errors = validatePost({ description: "a".repeat(301) });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("300자");
    });

    it("rejects empty description", () => {
      const errors = validatePost({ description: "" });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("비어있음");
    });
  });

  describe("category", () => {
    it.each(["til", "retrospective", "article", "tutorial", "infra"])(
      "passes valid category: %s",
      (category) => {
        expect(validatePost({ category })).toEqual([]);
      },
    );

    it("rejects invalid category", () => {
      const errors = validatePost({ category: "blog" });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("유효하지 않음");
      expect(errors[0]).toContain("til");
    });
  });

  describe("tags", () => {
    it("passes valid tags", () => {
      expect(validatePost({ tags: ["aws", "private-endpoint"] })).toEqual([]);
    });

    it("rejects more than 7 tags", () => {
      const tags = Array.from({ length: 8 }, (_, i) => `tag-${i}`);
      const errors = validatePost({ tags });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("최대 7개");
    });

    it("rejects uppercase tags", () => {
      const errors = validatePost({ tags: ["React"] });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("소문자 하이픈");
    });

    it("rejects tags with spaces", () => {
      const errors = validatePost({ tags: ["my tag"] });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("소문자 하이픈");
    });

    it("passes empty tags array", () => {
      expect(validatePost({ tags: [] })).toEqual([]);
    });
  });

  describe("body: JSX detection", () => {
    it("rejects <Callout> component", () => {
      const body =
        '## Hello\n\n<Callout type="warning">Do not do this</Callout>';
      const errors = validatePost({ body });
      expect(errors.some((e) => e.includes("Callout"))).toBe(true);
      expect(errors.some((e) => e.includes("GFM Alert"))).toBe(true);
    });

    it("rejects <LinkCard> component", () => {
      const body = '## Hello\n\n<LinkCard href="/blog/foo" title="Foo" />';
      const errors = validatePost({ body });
      expect(errors.some((e) => e.includes("LinkCard"))).toBe(true);
    });

    it("rejects <MermaidDiagram> component", () => {
      const body = '## Hello\n\n<MermaidDiagram chart="graph TD; A-->B" />';
      const errors = validatePost({ body });
      expect(errors.some((e) => e.includes("MermaidDiagram"))).toBe(true);
    });

    it("rejects import statements", () => {
      const body = 'import Foo from "@/components/Foo";\n\n## Hello';
      const errors = validatePost({ body });
      expect(errors.some((e) => e.includes("import"))).toBe(true);
    });

    it("passes GFM alert syntax", () => {
      const body = "## Hello\n\n> [!WARNING] Watch out\n> This is fine";
      const errors = validatePost({ body });
      expect(errors).toEqual([]);
    });

    it("passes mermaid code block", () => {
      const body = "## Hello\n\n```mermaid\ngraph TD\n  A --> B\n```";
      const errors = validatePost({ body });
      expect(errors).toEqual([]);
    });
  });

  describe("body: heading rules", () => {
    it("rejects H1 heading", () => {
      const body = "# Top Level Heading\n\nSome content";
      const errors = validatePost({ body });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("H1");
    });

    it("passes H2 heading", () => {
      const body = "## Section\n\nSome content";
      expect(validatePost({ body })).toEqual([]);
    });

    it("does not flag ## as H1", () => {
      const body = "## Not H1\n\n### Also fine";
      expect(validatePost({ body })).toEqual([]);
    });
  });

  describe("combined validation", () => {
    it("returns multiple errors at once", () => {
      const errors = validatePost({
        slug: "BAD SLUG",
        title: "a".repeat(101),
        category: "invalid",
        body: "# H1 not allowed\n\n<Callout>bad</Callout>",
      });
      expect(errors.length).toBeGreaterThanOrEqual(4);
    });

    it("passes fully valid post", () => {
      const errors = validatePost({
        slug: "valid-post",
        title: "Valid Post Title — with em dash",
        description: "A concise description of the post.",
        category: "article",
        tags: ["typescript", "testing"],
        body: "## Introduction\n\nSome content here.\n\n> [!TIP] Pro tip\n> Use validation.\n\n```mermaid\ngraph LR\n  A --> B\n```",
      });
      expect(errors).toEqual([]);
    });

    it("skips validation for undefined fields", () => {
      expect(validatePost({})).toEqual([]);
    });
  });
});
