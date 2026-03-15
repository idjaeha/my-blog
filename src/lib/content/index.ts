import { AstroContentLoader } from "./astro-loader";
import type { ContentService } from "./types";

// v1: Astro Content Collections
// Future: swap to CMSLoader (Sanity, Contentful, etc.)
export const contentService: ContentService = new AstroContentLoader();
export type { ContentService, Post } from "./types";
