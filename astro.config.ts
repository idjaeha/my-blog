import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { remarkMermaid } from "./src/lib/remark-mermaid";
import { remarkCallout } from "./src/lib/remark-callout";

export default defineConfig({
  site: "https://my-blog.site",
  output: "static",
  adapter: vercel({
    isr: {
      // On-Demand Revalidation 모드
      // Supabase webhook을 통해 특정 페이지만 무효화하고 재생성
      expiration: false, // 자동 만료 비활성화 (수동 무효화만 사용)
      bypassToken: process.env.ISR_BYPASS_TOKEN,
    },
  }),
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkMermaid, remarkCallout],
    rehypePlugins: [
      rehypeRaw,
      [
        rehypePrettyCode,
        {
          theme: {
            light: "github-light",
            dark: "github-dark",
          },
          keepBackground: false,
          defaultLang: "plaintext",
          bypassInlineCode: true,
          onVisitLine(node: any) {
            // Prevent empty lines from collapsing
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
                // Add data-line-numbers to code blocks (pre > code), not inline code
                const codeEl = node.children?.find(
                  (child: any) => child.tagName === "code",
                );
                if (codeEl) {
                  codeEl.properties["data-line-numbers"] = "";
                }
              },
            },
          ],
        },
      ],
    ],
  },
  i18n: {
    defaultLocale: "ko",
    locales: ["ko", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
