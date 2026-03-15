import type { APIContext, InferGetStaticPathsType } from "astro";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { contentService } from "@/lib/content";
import { SITE, CATEGORIES } from "@/lib/constants";

async function loadFont(): Promise<ArrayBuffer> {
  // Try to load local font first, fallback to fetching from Google Fonts
  try {
    const fontPath = join(process.cwd(), "public", "fonts", "Inter-Bold.ttf");
    const buffer = await readFile(fontPath);
    return buffer.buffer as ArrayBuffer;
  } catch {
    // Fetch Inter Bold from Google Fonts CDN
    const res = await fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf",
    );
    return await res.arrayBuffer();
  }
}

export async function getStaticPaths() {
  const koPosts = await contentService.getAllPosts("ko");
  const enPosts = await contentService.getAllPosts("en");

  const koPaths = koPosts.map((post) => ({
    params: { slug: `blog/${post.slug}` },
    props: {
      title: post.title,
      category: post.category,
      locale: "ko" as const,
    },
  }));

  const enPaths = enPosts.map((post) => ({
    params: { slug: `en/blog/${post.slug}` },
    props: {
      title: post.title,
      category: post.category,
      locale: "en" as const,
    },
  }));

  return [...koPaths, ...enPaths];
}

type Props = InferGetStaticPathsType<typeof getStaticPaths>["props"];

export async function GET(context: APIContext) {
  const { title, category, locale } = context.props as Props;
  const categoryLabel =
    CATEGORIES[category as keyof typeof CATEGORIES]?.[locale] ?? category;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                marginBottom: "24px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      backgroundColor: "#3b82f6",
                      color: "#ffffff",
                      padding: "6px 16px",
                      borderRadius: "6px",
                      fontSize: "20px",
                      fontWeight: 600,
                    },
                    children: categoryLabel,
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: title.length > 40 ? "42px" : "52px",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.3,
                marginBottom: "40px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                paddingTop: "20px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "24px",
                      color: "rgba(255, 255, 255, 0.8)",
                      fontWeight: 500,
                    },
                    children: SITE.title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "20px",
                      color: "rgba(255, 255, 255, 0.5)",
                    },
                    children: SITE.author,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: await loadFont(),
          weight: 700 as const,
          style: "normal" as const,
        },
      ],
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
