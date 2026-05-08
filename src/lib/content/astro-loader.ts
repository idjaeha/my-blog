import { getCollection, getEntry, render } from "astro:content";
import type { ContentService, Post } from "./types";

export class AstroContentLoader implements ContentService {
  async getPost(slug: string, locale: string = "ko"): Promise<Post | null> {
    const id = `${locale}/${slug}`;
    const entry = await getEntry("blog", id);
    if (!entry) return null;
    return this.mapEntry(entry, locale);
  }

  async getAllPosts(locale: string = "ko"): Promise<Post[]> {
    const entries = await getCollection("blog", (entry) => {
      return entry.id.startsWith(`${locale}/`) && !entry.data.draft;
    });
    return entries
      .map((e) => this.mapEntry(e, locale))
      .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
  }

  async getPostsByTag(tag: string, locale: string = "ko"): Promise<Post[]> {
    const posts = await this.getAllPosts(locale);
    return posts.filter((p) => p.tags.includes(tag));
  }

  async getPostsByCategory(
    category: string,
    locale: string = "ko",
  ): Promise<Post[]> {
    const posts = await this.getAllPosts(locale);
    return posts.filter((p) => p.category === category);
  }

  async getPostsBySeries(
    series: string,
    locale: string = "ko",
  ): Promise<Post[]> {
    const posts = await this.getAllPosts(locale);
    return posts
      .filter((p) => p.series === series)
      .sort(
        (a, b) =>
          (a.seriesOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.seriesOrder ?? Number.MAX_SAFE_INTEGER),
      );
  }

  async getAllTags(locale: string = "ko"): Promise<string[]> {
    const posts = await this.getAllPosts(locale);
    const tags = new Set(posts.flatMap((p) => p.tags));
    return [...tags].sort();
  }

  async getAllCategories(locale: string = "ko"): Promise<string[]> {
    const posts = await this.getAllPosts(locale);
    const categories = new Set(posts.map((p) => p.category));
    return [...categories].sort();
  }

  async getAllSeries(locale: string = "ko"): Promise<string[]> {
    const posts = await this.getAllPosts(locale);
    const series = new Set(
      posts.map((p) => p.series).filter((s): s is string => Boolean(s)),
    );
    return [...series].sort();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapEntry(entry: any, locale: string): Post {
    const slug = entry.id.replace(`${locale}/`, "");
    return {
      id: entry.id,
      slug,
      locale: locale as "ko" | "en",
      body: entry.body ?? "",
      render: () => render(entry),
      ...entry.data,
    };
  }
}
