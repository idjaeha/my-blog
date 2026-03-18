import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { contentService } from "@/lib/content";
import { SITE, CATEGORIES } from "@/lib/constants";

export async function GET(context: APIContext) {
  const posts = await contentService.getAllPosts("en");
  return rss({
    title: `${SITE.title} (English)`,
    description: SITE.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: post.publishedDate,
      description: post.description,
      link: `/en/blog/${post.slug}`,
      categories: [
        CATEGORIES[post.category as keyof typeof CATEGORIES]?.en ??
          post.category,
        ...(post.tags || []),
      ],
      author: SITE.author.email
        ? `${SITE.author.email} (${SITE.author.name})`
        : SITE.author.name,
      customData: post.updatedDate
        ? `<lastBuildDate>${new Date(post.updatedDate).toUTCString()}</lastBuildDate>`
        : undefined,
    })),
  });
}
