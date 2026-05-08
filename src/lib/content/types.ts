export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: "til" | "retrospective" | "article" | "tutorial" | "infra";
  tags: string[];
  publishedDate: Date;
  updatedDate?: Date;
  draft: boolean;
  coverImage?: string;
  series?: string;
  seriesOrder?: number;
  locale: "ko" | "en";
  body: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: () => Promise<{ Content: any }>;

  // Translation metadata
  translatedFrom?: string; // Original post reference (e.g., "ko/hello-world")
  hasTranslations?: string[]; // Available translation locales (e.g., ["en"])
  translationStatus?: "draft" | "reviewed" | "published"; // Translation review status
}

export interface ContentService {
  getPost(slug: string, locale?: string): Promise<Post | null>;
  getAllPosts(locale?: string): Promise<Post[]>;
  getPostsByTag(tag: string, locale?: string): Promise<Post[]>;
  getPostsByCategory(category: string, locale?: string): Promise<Post[]>;
  getPostsBySeries(series: string, locale?: string): Promise<Post[]>;
  getAllTags(locale?: string): Promise<string[]>;
  getAllCategories(locale?: string): Promise<string[]>;
  getAllSeries(locale?: string): Promise<string[]>;
}
