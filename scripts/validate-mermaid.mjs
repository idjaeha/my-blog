#!/usr/bin/env node

/**
 * Validate mermaid code blocks in md/mdx files.
 * Usage: node scripts/validate-mermaid.mjs [file...]
 * If no files are given, validates all md/mdx files in src/content/.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Window } from "happy-dom";

// Provide minimal DOM environment for mermaid
const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.SVGElement = window.SVGElement;
globalThis.Element = window.Element;
globalThis.XMLSerializer = window.XMLSerializer;

// navigator is read-only in Node 22+, so only set if writable
if (!globalThis.navigator) {
  globalThis.navigator = window.navigator;
}

const MERMAID_BLOCK_RE = /```mermaid\s*\n([\s\S]*?)```/g;

function extractMermaidBlocks(content, filePath) {
  const blocks = [];
  let match;
  while ((match = MERMAID_BLOCK_RE.exec(content)) !== null) {
    const code = match[1].trim();
    const line = content.slice(0, match.index).split("\n").length;
    blocks.push({ code, line, filePath });
  }
  return blocks;
}

function getFiles(args) {
  if (args.length > 0) return args;
  const output = execFileSync(
    "find",
    ["src/content", "-name", "*.md", "-o", "-name", "*.mdx"],
    { encoding: "utf-8" },
  );
  return output.trim().split("\n").filter(Boolean);
}

async function main() {
  const files = getFiles(process.argv.slice(2));
  const allBlocks = [];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    allBlocks.push(...extractMermaidBlocks(content, file));
  }

  if (allBlocks.length === 0) {
    console.log("No mermaid blocks found.");
    process.exit(0);
  }

  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({ startOnLoad: false });

  const errors = [];
  for (const block of allBlocks) {
    try {
      await mermaid.parse(block.code);
    } catch (err) {
      errors.push({
        file: block.filePath,
        line: block.line,
        message: err.message || String(err),
      });
    }
  }

  if (errors.length > 0) {
    console.error(
      `\n❌ Mermaid validation failed (${errors.length} error(s)):\n`,
    );
    for (const err of errors) {
      console.error(`  ${err.file}:${err.line}`);
      console.error(`    ${err.message}\n`);
    }
    process.exit(1);
  }

  console.log(`✅ All ${allBlocks.length} mermaid block(s) valid.`);
}

main();
