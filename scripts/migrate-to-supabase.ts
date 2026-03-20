/**
 * Migration script: MDX files → Supabase posts table
 *
 * Usage:
 *   node --env-file=.env --import=tsx scripts/migrate-to-supabase.ts
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CONTENT_DIR = join(import.meta.dirname, "../src/content/blog");

interface MdxPost {
  slug: string;
  locale: string;
  frontmatter: Record<string, unknown>;
  body: string;
  archived: boolean;
}

function collectMdxFiles(
  dir: string,
  locale: string,
  archived = false,
): MdxPost[] {
  const posts: MdxPost[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry === "_archive") {
        // Archive files have format: {locale}-{slug}.mdx
        posts.push(...collectMdxFiles(fullPath, locale, true));
      }
      continue;
    }

    if (!entry.endsWith(".mdx") && !entry.endsWith(".md")) continue;

    const raw = readFileSync(fullPath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    let slug: string;
    if (archived) {
      // archived files: ko-some-slug.mdx → some-slug
      const name = basename(entry, ".mdx").replace(/\.md$/, "");
      slug = name.replace(new RegExp(`^${locale}-`), "");
    } else {
      slug = basename(entry, ".mdx").replace(/\.md$/, "");
    }

    posts.push({ slug, locale, frontmatter, body: content, archived });
  }

  return posts;
}

async function migrate() {
  const locales = ["ko", "en"];
  const allPosts: MdxPost[] = [];

  for (const locale of locales) {
    const localeDir = join(CONTENT_DIR, locale);
    try {
      statSync(localeDir);
      allPosts.push(...collectMdxFiles(localeDir, locale));
    } catch {
      console.log(`No directory for locale: ${locale}`);
    }
  }

  console.log(`Found ${allPosts.length} posts to migrate`);

  let success = 0;
  let failed = 0;

  for (const post of allPosts) {
    const row = {
      slug: post.slug,
      locale: post.locale,
      title: post.frontmatter.title as string,
      description: post.frontmatter.description as string,
      category: post.frontmatter.category as string,
      tags: (post.frontmatter.tags as string[]) || [],
      body: post.body.trim(),
      draft: (post.frontmatter.draft as boolean) ?? false,
      published_date: post.frontmatter.publishedDate
        ? new Date(post.frontmatter.publishedDate as string).toISOString()
        : null,
      updated_date: post.frontmatter.updatedDate
        ? new Date(post.frontmatter.updatedDate as string).toISOString()
        : null,
      series: (post.frontmatter.series as string) || null,
      series_order: (post.frontmatter.seriesOrder as number) || null,
      cover_image: null,
      archived_at: post.archived ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("posts").upsert(row, {
      onConflict: "slug,locale",
    });

    if (error) {
      console.error(`FAILED: ${post.locale}/${post.slug} — ${error.message}`);
      failed++;
    } else {
      console.log(
        `OK: ${post.locale}/${post.slug}${post.archived ? " (archived)" : ""}`,
      );
      success++;
    }
  }

  console.log(
    `\nMigration complete: ${success} succeeded, ${failed} failed out of ${allPosts.length}`,
  );
}

migrate().catch(console.error);
