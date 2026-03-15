export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: "til" | "retrospective" | "article" | "tutorial";
  tags: string[];
  publishedDate: Date;
  updatedDate?: Date;
  draft: boolean;
  coverImage?: string;
  series?: string;
  seriesOrder?: number;
  locale: "ko" | "en";
  body: string;
  render: () => Promise<{ Content: any }>;
}

export interface ContentService {
  getPost(slug: string, locale?: string): Promise<Post | null>;
  getAllPosts(locale?: string): Promise<Post[]>;
  getPostsByTag(tag: string, locale?: string): Promise<Post[]>;
  getPostsByCategory(category: string, locale?: string): Promise<Post[]>;
  getAllTags(locale?: string): Promise<string[]>;
  getAllCategories(): Promise<string[]>;
}
