import type { APIContext, InferGetStaticPathsType } from "astro";
import { contentService } from "@/lib/content";
import { CATEGORIES } from "@/lib/constants";
import { generateOgImage } from "@/lib/og";
import { SITE } from "@/lib/constants";

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

  const png = await generateOgImage({
    title,
    badge: categoryLabel,
    subtitle: SITE.author,
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
}
