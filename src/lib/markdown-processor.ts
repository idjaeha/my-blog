import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { remarkMermaid } from "./remark-mermaid";
import { remarkCallout } from "./remark-callout";
import type { Element } from "hast";

/**
 * Process Markdown content from Supabase and apply the same
 * remark/rehype pipeline as Astro's markdown processing.
 */
export async function processMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMermaid)
    .use(remarkCallout)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, {
      theme: {
        light: "github-light",
        dark: "github-dark",
      },
      keepBackground: false,
      defaultLang: "plaintext",
      bypassInlineCode: true,
      onVisitLine(node: any) {
        if (node.children.length === 0) {
          node.children = [{ type: "text", value: " " }];
        }
      },
      onVisitHighlightedLine(node: any) {
        node.properties.className = node.properties.className || [];
        node.properties.className.push("highlighted");
      },
      onVisitHighlightedChars(node: any) {
        node.properties.className = ["highlighted-chars"];
      },
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        {
          pre(node: any) {
            // Add data-line-numbers to code blocks (pre > code)
            const codeEl = node.children?.find(
              (child: any) => child.tagName === "code",
            );
            if (codeEl) {
              codeEl.properties["data-line-numbers"] = "";
            }
          },
        },
      ],
    })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}
