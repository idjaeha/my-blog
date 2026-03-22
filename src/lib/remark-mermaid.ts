import type { Root } from "mdast";
import { visit } from "unist-util-visit";

/**
 * Remark plugin for Mermaid diagrams.
 *
 * In MDX files: transforms to <MermaidDiagram> JSX component (interactive, with zoom).
 * In Markdown (Supabase posts via renderMarkdown): outputs <pre class="mermaid"> HTML
 * which the client-side mermaid library renders directly.
 *
 * Detection: if any node in the tree uses MDX-specific types (mdxjsEsm, mdxJsxFlowElement),
 * we're in MDX mode. Otherwise, fall back to HTML output.
 */
export function remarkMermaid() {
  return (tree: Root) => {
    const mermaidNodes: {
      node: (typeof tree.children)[number];
      index: number;
      parent: typeof tree;
    }[] = [];

    // First pass: collect mermaid code blocks
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || index === undefined || !parent) return;
      mermaidNodes.push({ node, index, parent: parent as typeof tree });
    });

    if (mermaidNodes.length === 0) return;

    // Detect MDX context: check if tree already has MDX-specific nodes
    // or if we can create them (MDX processor adds support for these types)
    const isMdx = isMdxContext(tree);

    console.log(
      `[remarkMermaid] Found ${mermaidNodes.length} mermaid blocks, isMdx: ${isMdx}`,
    );

    if (isMdx) {
      // MDX mode: create JSX component nodes
      for (const { node, index, parent } of mermaidNodes) {
        const mermaidNode = {
          type: "mdxJsxFlowElement",
          name: "MermaidDiagram",
          attributes: [
            { type: "mdxJsxAttribute", name: "client:visible", value: null },
            {
              type: "mdxJsxAttribute",
              name: "chart",
              value: (node as { value: string }).value,
            },
          ],
          children: [],
        };
        parent.children.splice(index, 1, mermaidNode as never);
      }

      // Add import statement
      tree.children.unshift({
        type: "mdxjsEsm",
        value: 'import MermaidDiagram from "@/components/mdx/MermaidDiagram";',
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body: [
              {
                type: "ImportDeclaration",
                source: {
                  type: "Literal",
                  value: "@/components/mdx/MermaidDiagram",
                  raw: '"@/components/mdx/MermaidDiagram"',
                },
                specifiers: [
                  {
                    type: "ImportDefaultSpecifier",
                    local: { type: "Identifier", name: "MermaidDiagram" },
                  },
                ],
              },
            ],
          },
        },
      } as never);
    } else {
      // Markdown mode: output HTML that client-side mermaid.js will render
      for (const { node, index, parent } of mermaidNodes) {
        const htmlNode = {
          type: "html",
          value: `<div class="mermaid-diagram my-6 flex justify-center"><pre class="mermaid">${escapeHtml((node as { value: string }).value)}</pre></div>`,
        };
        parent.children.splice(index, 1, htmlNode as never);
      }
    }
  };
}

function isMdxContext(tree: Root): boolean {
  // Try to create an mdxJsxFlowElement — if the processor supports it,
  // we're in MDX mode. In practice, we detect by checking the tree structure.
  // MDX files processed by @astrojs/mdx will have mdxjsEsm or mdxJsxFlowElement nodes.
  // For renderMarkdown() (plain markdown), these types don't exist.
  // A simple heuristic: if the file has any existing MDX nodes, it's MDX.
  // Since remarkMermaid runs early (before other MDX transforms), we use a different approach:
  // check if the remark processor has MDX extensions registered.
  // The safest heuristic: try to detect if we're in the MDX pipeline by checking
  // if the tree data has MDX-related properties.
  for (const child of tree.children) {
    const childType = (child as any).type;
    if (
      childType === "mdxjsEsm" ||
      childType === "mdxJsxFlowElement" ||
      childType === "mdxJsxTextElement" ||
      childType === "mdxFlowExpression" ||
      childType === "mdxTextExpression"
    ) {
      return true;
    }
  }

  // If no MDX nodes found yet, check if MDX-specific node types are valid
  // by looking at whether any import/export or JSX exists deeper in the tree
  let hasMdx = false;
  visit(tree, (node) => {
    const nodeType = (node as any).type;
    if (
      nodeType === "mdxjsEsm" ||
      nodeType === "mdxJsxFlowElement" ||
      nodeType === "mdxJsxTextElement"
    ) {
      hasMdx = true;
      return false; // stop visiting
    }
  });

  return hasMdx;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
