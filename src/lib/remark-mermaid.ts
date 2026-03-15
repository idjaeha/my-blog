import type { Root } from "mdast";
import { visit } from "unist-util-visit";

export function remarkMermaid() {
  return (tree: Root) => {
    let hasMermaid = false;

    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || index === undefined || !parent) return;

      hasMermaid = true;

      const mermaidNode = {
        type: "mdxJsxFlowElement",
        name: "MermaidDiagram",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "client:visible",
            value: null,
          },
          {
            type: "mdxJsxAttribute",
            name: "chart",
            value: node.value,
          },
        ],
        children: [],
      };

      parent.children.splice(index, 1, mermaidNode as never);
    });

    if (hasMermaid) {
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
    }
  };
}
