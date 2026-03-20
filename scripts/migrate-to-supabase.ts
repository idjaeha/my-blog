/**
 * Migration script: MDX files → Supabase posts table
 * Converts JSX components (Callout, LinkCard, MermaidDiagram) to Markdown equivalents.
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

// ─── JSX → Markdown conversion ──────────────────────────────────

const CALLOUT_TYPE_MAP: Record<string, string> = {
  info: "NOTE",
  tip: "TIP",
  warning: "WARNING",
  danger: "CAUTION",
};

function convertJsxToMarkdown(body: string): string {
  let result = body;

  // Remove import statements for MDX components
  result = result.replace(
    /import\s+\w+\s+from\s+["']@\/components\/mdx\/\w+["'];?\s*\n?/g,
    "",
  );

  // Convert <Callout ...>content</Callout>
  // Handles any order of type/title attributes
  result = result.replace(
    /<Callout\s([^>]*)>\s*\n?([\s\S]*?)\n?\s*<\/Callout>/g,
    (_match, attrs: string, content: string) => {
      const typeMatch = attrs.match(/type=["'](\w+)["']/);
      const titleMatch = attrs.match(/title=["']([^"']*)["']/);
      const type = typeMatch?.[1] || "info";
      const alertType = CALLOUT_TYPE_MAP[type] || "NOTE";
      const displayTitle = titleMatch?.[1] || "";

      const lines = content.trim().split("\n");
      const quotedContent = lines.map((line: string) => `> ${line}`).join("\n");

      return `> [!${alertType}]${displayTitle ? ` ${displayTitle}` : ""}\n${quotedContent}`;
    },
  );

  // Convert <LinkCard href="url" title="T" description="D" />
  // Flexible: collects all attributes regardless of order/whitespace
  result = result.replace(
    /<LinkCard\s+([\s\S]*?)\/>/g,
    (_match, attrs: string) => {
      const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
      const titleMatch = attrs.match(/title=["']([^"']*)["']/);
      const descMatch = attrs.match(/description=["']([^"']*)["']/);

      const href = hrefMatch?.[1] || "#";
      const title = titleMatch?.[1] || "Link";
      const description = descMatch?.[1];

      if (description) {
        return `[${title}](${href}) — ${description}`;
      }
      return `[${title}](${href})`;
    },
  );

  // Convert <MermaidDiagram client:visible chart="..." />
  // The chart attribute contains the mermaid diagram source (may have escaped quotes)
  result = result.replace(
    /<MermaidDiagram\s*\n?\s*(?:client:visible\s*\n?\s*)?chart=["']([\s\S]*?)["']\s*\n?\s*\/>/g,
    (_match, chart) => {
      // Unescape any escaped characters
      const unescaped = chart.replace(/\\n/g, "\n").replace(/\\"/g, '"');
      return "```mermaid\n" + unescaped.trim() + "\n```";
    },
  );

  // Also handle MermaidDiagram with template literal style chart={`...`}
  result = result.replace(
    /<MermaidDiagram\s*\n?\s*(?:client:visible\s*\n?\s*)?chart=\{`([\s\S]*?)`\}\s*\n?\s*\/>/g,
    (_match, chart) => {
      return "```mermaid\n" + chart.trim() + "\n```";
    },
  );

  // Clean up multiple consecutive blank lines (max 2)
  result = result.replace(/\n{4,}/g, "\n\n\n");

  // Clean up leading blank lines from removed imports
  result = result.replace(/^\n+/, "\n");

  return result;
}

// ─── File collection ────────────────────────────────────────────

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
        posts.push(...collectMdxFiles(fullPath, locale, true));
      }
      continue;
    }

    if (!entry.endsWith(".mdx") && !entry.endsWith(".md")) continue;

    const raw = readFileSync(fullPath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    let slug: string;
    if (archived) {
      const name = basename(entry, ".mdx").replace(/\.md$/, "");
      slug = name.replace(new RegExp(`^${locale}-`), "");
    } else {
      slug = basename(entry, ".mdx").replace(/\.md$/, "");
    }

    // Convert JSX components to Markdown
    const convertedBody = convertJsxToMarkdown(content);

    posts.push({
      slug,
      locale,
      frontmatter,
      body: convertedBody,
      archived,
    });
  }

  return posts;
}

// ─── Migration ──────────────────────────────────────────────────

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
  let converted = 0;

  for (const post of allPosts) {
    // Check if conversion happened
    const rawContent = readFileSync(
      join(
        CONTENT_DIR,
        post.archived ? `${post.locale}/_archive` : post.locale,
        post.archived ? `${post.locale}-${post.slug}.mdx` : `${post.slug}.mdx`,
      ),
      "utf-8",
    );
    const hasJsx =
      rawContent.includes("<Callout") ||
      rawContent.includes("<LinkCard") ||
      rawContent.includes("<MermaidDiagram");
    if (hasJsx) converted++;

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
      const suffix = [
        post.archived ? "(archived)" : "",
        hasJsx ? "(JSX→MD converted)" : "",
      ]
        .filter(Boolean)
        .join(" ");
      console.log(`OK: ${post.locale}/${post.slug} ${suffix}`);
      success++;
    }
  }

  console.log(
    `\nMigration complete: ${success} succeeded, ${failed} failed out of ${allPosts.length}`,
  );
  if (converted > 0) {
    console.log(`${converted} posts had JSX components converted to Markdown`);
  }
}

migrate().catch(console.error);
