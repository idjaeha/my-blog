import type { Loader } from "astro/loaders";
import { createClient } from "@supabase/supabase-js";
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
import { remarkCallout } from "../lib/remark-callout";

export function supabaseBlogLoader(): Loader {
  return {
    name: "supabase-blog",
    async load(ctx) {
      const url = import.meta.env.SUPABASE_URL;
      const key = import.meta.env.SUPABASE_ANON_KEY;

      if (!url || !key) {
        ctx.logger.warn(
          "supabase-blog: SUPABASE_URL or SUPABASE_ANON_KEY not set, skipping",
        );
        return;
      }

      // Custom fetch wrapper for Node.js compatibility (Vercel)
      const customFetch: typeof fetch = (input, init) => {
        if (init?.body) {
          return fetch(input, {
            ...init,
            duplex: "half",
          } as RequestInit & { duplex: "half" });
        }
        return fetch(input, init);
      };

      const supabase = createClient(url, key, {
        global: { fetch: customFetch },
      });

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("draft", false)
        .is("archived_at", null);

      if (error) {
        ctx.logger.error(`supabase-blog: ${error.message}`);
        return;
      }

      ctx.store.clear();

      for (const post of posts ?? []) {
        const id = `${post.locale}/${post.slug}`;
        const body = post.body ?? "";

        // Process markdown with unified pipeline to ensure plugins are applied
        const file = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkCallout)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeRaw)
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
          .use(rehypeStringify)
          .process(body);

        const html = String(file);

        const rendered = {
          html,
          metadata: {},
        };

        const data = await ctx.parseData({
          id,
          data: {
            title: post.title,
            description: post.description,
            category: post.category,
            tags: post.tags ?? [],
            publishedDate: post.published_date,
            updatedDate: post.updated_date ?? undefined,
            draft: post.draft,
            coverImage: post.cover_image ?? undefined,
            series: post.series ?? undefined,
            seriesOrder: post.series_order ?? undefined,
          },
        });

        ctx.store.set({
          id,
          data,
          body,
          rendered,
          digest: ctx.generateDigest(body),
        });
      }

      ctx.logger.info(
        `supabase-blog: loaded ${posts?.length ?? 0} posts from Supabase`,
      );
    },
  };
}
