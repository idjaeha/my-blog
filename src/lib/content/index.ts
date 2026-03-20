import { AstroContentLoader } from "./astro-loader";
import type { ContentService } from "./types";

// Blog rendering: Astro Content Collections (local MDX files)
// CMS/API: Supabase via REST API + MCP Server (see src/pages/api/)
export const contentService: ContentService = new AstroContentLoader();
export type { ContentService, Post } from "./types";
