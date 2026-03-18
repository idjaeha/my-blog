#!/usr/bin/env node

/**
 * AI-powered blog post translation script
 *
 * This script translates Korean MDX blog posts to English using Claude AI.
 * It preserves MDX components (Callout, MermaidDiagram, etc.) and code blocks.
 *
 * Prerequisites:
 * 1. Install @anthropic-ai/sdk: pnpm add -D @anthropic-ai/sdk
 * 2. Set ANTHROPIC_API_KEY environment variable
 *
 * Usage:
 *   node scripts/translate-post.mjs <source-file> [target-file]
 *
 * Example:
 *   node scripts/translate-post.mjs src/content/blog/ko/hello-world.mdx
 *   node scripts/translate-post.mjs src/content/blog/ko/hello-world.mdx src/content/blog/en/hello-world.mdx
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Preserve MDX components and code blocks during translation
 */
function protectMdxComponents(content) {
  const protectedBlocks = [];
  let counter = 0;

  // Protect code blocks (```...```)
  let protected = content.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${counter}__`;
    protectedBlocks.push({ placeholder, content: match });
    counter++;
    return placeholder;
  });

  // Protect inline code (`...`)
  protected = protected.replace(/`[^`\n]+`/g, (match) => {
    const placeholder = `__INLINE_CODE_${counter}__`;
    protectedBlocks.push({ placeholder, content: match });
    counter++;
    return placeholder;
  });

  // Protect MDX components (e.g., <Callout>, <MermaidDiagram>)
  protected = protected.replace(/<[A-Z][a-zA-Z0-9]*[\s\S]*?<\/[A-Z][a-zA-Z0-9]*>/g, (match) => {
    const placeholder = `__MDX_COMPONENT_${counter}__`;
    protectedBlocks.push({ placeholder, content: match });
    counter++;
    return placeholder;
  });

  // Protect self-closing MDX components (e.g., <Component />)
  protected = protected.replace(/<[A-Z][a-zA-Z0-9]*[^>]*\/>/g, (match) => {
    const placeholder = `__MDX_SELF_CLOSING_${counter}__`;
    protectedBlocks.push({ placeholder, content: match });
    counter++;
    return placeholder;
  });

  return { protected, protectedBlocks };
}

/**
 * Restore protected blocks after translation
 */
function restoreProtectedBlocks(content, protectedBlocks) {
  let restored = content;
  for (const { placeholder, content: originalContent } of protectedBlocks) {
    restored = restored.replace(placeholder, originalContent);
  }
  return restored;
}

/**
 * Translate content using Claude AI
 */
async function translateWithClaude(content, apiKey) {
  try {
    // Dynamically import Anthropic SDK
    const { default: Anthropic } = await import('@anthropic-ai/sdk');

    const client = new Anthropic({ apiKey });

    log('\n🤖 Translating content with Claude...', colors.cyan);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: `You are a professional technical translator. Translate the following Korean blog post content to natural, fluent English.

IMPORTANT RULES:
1. Preserve all placeholder text (e.g., __CODE_BLOCK_0__, __MDX_COMPONENT_1__, etc.) EXACTLY as they appear
2. Maintain the same paragraph structure and formatting
3. Keep technical terms accurate
4. Use natural English expressions, not literal translations
5. Preserve all markdown formatting (headers, lists, bold, italic, etc.)
6. Do NOT add any explanations or comments - only provide the translation

Korean content to translate:

${content}

Provide ONLY the English translation, nothing else.`,
        },
      ],
    });

    const translatedContent = response.content[0].text;
    log('✅ Translation completed', colors.green);

    return translatedContent;
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(
        'Anthropic SDK not found. Please install it:\n  pnpm add -D @anthropic-ai/sdk'
      );
    }
    throw error;
  }
}

/**
 * Translate frontmatter fields
 */
function translateFrontmatter(data) {
  // These fields typically need translation
  const fieldsToTranslate = ['title', 'description'];

  // Note: Actual translation of these fields should be done via API as well
  // For now, we'll mark them for manual review
  const translated = { ...data };

  for (const field of fieldsToTranslate) {
    if (translated[field]) {
      // Add a comment for manual review
      translated[`_${field}_original`] = translated[field];
    }
  }

  return translated;
}

/**
 * Extract slug from file path
 */
function extractSlug(filePath) {
  const basename = path.basename(filePath, '.mdx');
  return basename;
}

/**
 * Main translation function
 */
async function translatePost(sourcePath, targetPath) {
  try {
    // Validate source file
    const sourceAbsPath = path.resolve(rootDir, sourcePath);
    const sourceExists = await fs.access(sourceAbsPath).then(() => true).catch(() => false);

    if (!sourceExists) {
      throw new Error(`Source file not found: ${sourcePath}`);
    }

    log(`\n📖 Reading source file: ${sourcePath}`, colors.blue);

    // Read source MDX file
    const sourceContent = await fs.readFile(sourceAbsPath, 'utf-8');

    // Parse frontmatter and content
    const { data: frontmatter, content } = matter(sourceContent);

    log(`📝 Frontmatter: ${Object.keys(frontmatter).join(', ')}`, colors.cyan);

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY environment variable not set.\n' +
        'Get your API key from: https://console.anthropic.com/\n' +
        'Then set it: export ANTHROPIC_API_KEY=your-key-here'
      );
    }

    // Protect MDX components and code blocks
    log('\n🛡️  Protecting code blocks and MDX components...', colors.yellow);
    const { protected, protectedBlocks } = protectMdxComponents(content);
    log(`   Protected ${protectedBlocks.length} blocks`, colors.cyan);

    // Translate content
    const translatedProtected = await translateWithClaude(protected, apiKey);

    // Restore protected blocks
    log('\n🔄 Restoring protected blocks...', colors.yellow);
    const translatedContent = restoreProtectedBlocks(translatedProtected, protectedBlocks);

    // Prepare translated frontmatter
    const sourceSlug = extractSlug(sourcePath);
    const translatedFrontmatter = {
      ...frontmatter,
      translatedFrom: `ko/${sourceSlug}`,
      translationStatus: 'draft',
    };

    // Remove Korean-specific fields that need manual translation
    // These will be marked with _original suffix for reference
    if (translatedFrontmatter.title) {
      translatedFrontmatter._title_ko = translatedFrontmatter.title;
      translatedFrontmatter.title = '[TRANSLATE] ' + translatedFrontmatter.title;
    }
    if (translatedFrontmatter.description) {
      translatedFrontmatter._description_ko = translatedFrontmatter.description;
      translatedFrontmatter.description = '[TRANSLATE] ' + translatedFrontmatter.description;
    }

    // Construct final MDX
    const finalContent = matter.stringify(translatedContent, translatedFrontmatter);

    // Determine target path
    let targetAbsPath;
    if (targetPath) {
      targetAbsPath = path.resolve(rootDir, targetPath);
    } else {
      // Default: replace /ko/ with /en/ in path
      const defaultTarget = sourcePath.replace('/ko/', '/en/');
      targetAbsPath = path.resolve(rootDir, defaultTarget);
    }

    // Ensure target directory exists
    const targetDir = path.dirname(targetAbsPath);
    await fs.mkdir(targetDir, { recursive: true });

    // Write translated file
    await fs.writeFile(targetAbsPath, finalContent, 'utf-8');

    log(`\n✅ ${colors.bright}Translation completed!${colors.reset}`, colors.green);
    log(`   Source: ${sourcePath}`, colors.cyan);
    log(`   Target: ${path.relative(rootDir, targetAbsPath)}`, colors.cyan);
    log(`\n⚠️  ${colors.yellow}Next steps:${colors.reset}`);
    log(`   1. Review and translate frontmatter fields (title, description)`, colors.yellow);
    log(`   2. Review translated content for accuracy`, colors.yellow);
    log(`   3. Update translationStatus to "reviewed" when done`, colors.yellow);
    log(`   4. Add hasTranslations: ["en"] to the Korean source post`, colors.yellow);

  } catch (error) {
    log(`\n❌ ${colors.bright}Translation failed:${colors.reset}`, colors.red);
    log(`   ${error.message}`, colors.red);

    if (error.stack) {
      log(`\n${error.stack}`, colors.red);
    }

    process.exit(1);
  }
}

// CLI entry point
const args = process.argv.slice(2);

if (args.length === 0) {
  log(`
${colors.bright}AI-powered Blog Post Translation${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/translate-post.mjs <source-file> [target-file]

${colors.cyan}Examples:${colors.reset}
  node scripts/translate-post.mjs src/content/blog/ko/hello-world.mdx
  node scripts/translate-post.mjs src/content/blog/ko/hello-world.mdx src/content/blog/en/hello-world.mdx

${colors.yellow}Prerequisites:${colors.reset}
  1. Install dependencies: pnpm add -D @anthropic-ai/sdk
  2. Set API key: export ANTHROPIC_API_KEY=your-key-here

${colors.yellow}Environment:${colors.reset}
  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set'}
`, colors.reset);
  process.exit(1);
}

const [sourcePath, targetPath] = args;
translatePost(sourcePath, targetPath);
