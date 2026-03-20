import { AstroContentLoader } from "./astro-loader";
import type { ContentService } from "./types";

// Single source: Supabase posts loaded via custom Astro content loader ("blog" collection)
export const contentService: ContentService = new AstroContentLoader();
export type { ContentService, Post } from "./types";
