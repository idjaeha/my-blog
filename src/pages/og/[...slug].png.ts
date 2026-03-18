import type { APIContext } from "astro";
import type { Locale } from "@/i18n";
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
      category: post.category as keyof typeof CATEGORIES,
      locale: "ko" as Locale,
    },
  }));

  const enPaths = enPosts.map((post) => ({
    params: { slug: `en/blog/${post.slug}` },
    props: {
      title: post.title,
      category: post.category as keyof typeof CATEGORIES,
      locale: "en" as Locale,
    },
  }));

  return [...koPaths, ...enPaths];
}

interface Props {
  title: string;
  category: keyof typeof CATEGORIES;
  locale: Locale;
}

export async function GET(context: APIContext) {
  const { title, category, locale } = context.props as Props;
  const categoryLabel = CATEGORIES[category]?.[locale] ?? category;

  const png = await generateOgImage({
    title,
    badge: categoryLabel,
    subtitle: SITE.author.name,
  });

  return new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png" },
  });
}
