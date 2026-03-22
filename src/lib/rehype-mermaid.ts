import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin for Mermaid diagrams.
 *
 * Runs AFTER rehype-pretty-code to transform Mermaid code blocks
 * into <pre class="mermaid"> elements for client-side rendering.
 *
 * This plugin looks for code elements with data-language="mermaid"
 * (added by rehype-pretty-code) and replaces them with plain Mermaid HTML.
 */
export function rehypeMermaid() {
  return (tree: Root) => {
    const nodesToReplace: Array<{
      parent: Element;
      index: number;
      codeContent: string;
    }> = [];

    // Find all code blocks with language="mermaid"
    visit(tree, "element", (node: Element, index, parent) => {
      // Look for <figure data-rehype-pretty-code-figure> with mermaid language
      if (
        node.tagName === "figure" &&
        node.properties?.["dataRehypePrettyCodeFigure"] !== undefined
      ) {
        // Check if this figure contains a mermaid code block
        const preElement = node.children.find(
          (child: any) => child.type === "element" && child.tagName === "pre",
        ) as Element | undefined;

        if (!preElement) return;

        const codeElement = preElement.children.find(
          (child: any) => child.type === "element" && child.tagName === "code",
        ) as Element | undefined;

        if (!codeElement) return;

        // Check if this is a mermaid code block
        const dataLanguage = codeElement.properties?.["dataLanguage"];
        if (dataLanguage !== "mermaid") return;

        // Extract the mermaid code content from text nodes
        let mermaidCode = "";
        visit(codeElement, "text", (textNode: any) => {
          mermaidCode += textNode.value;
        });

        if (mermaidCode && parent && index !== undefined) {
          nodesToReplace.push({
            parent: parent as Element,
            index,
            codeContent: mermaidCode.trim(),
          });
        }
      }
    });

    console.log(
      `[rehypeMermaid] Found ${nodesToReplace.length} mermaid blocks to replace`,
    );

    // Replace in reverse order to maintain correct indices
    for (const { parent, index, codeContent } of nodesToReplace.reverse()) {
      const mermaidElement: Element = {
        type: "element",
        tagName: "div",
        properties: {
          className: ["mermaid-diagram", "my-6", "flex", "justify-center"],
        },
        children: [
          {
            type: "element",
            tagName: "pre",
            properties: { className: ["mermaid"] },
            children: [{ type: "text", value: codeContent }],
          },
        ],
      };

      parent.children.splice(index, 1, mermaidElement);
    }
  };
}
