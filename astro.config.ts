import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import { remarkMermaid } from "./src/lib/remark-mermaid";
import { remarkCallout } from "./src/lib/remark-callout";

export default defineConfig({
  site: "https://my-blog.site",
  output: "static",
  adapter: vercel(),
  integrations: [mdx(), react(), sitemap()],
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
