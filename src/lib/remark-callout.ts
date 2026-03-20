import type { Root, Blockquote, Paragraph, Text } from "mdast";
import { visit } from "unist-util-visit";

/**
 * Remark plugin to convert GitHub-style alerts (GFM Alerts) to HTML callout blocks.
 *
 * Syntax:
 *   > [!NOTE] Optional title
 *   > Content here
 *
 * Supported types: NOTE, TIP, WARNING, IMPORTANT, CAUTION
 * Maps to: info, tip, warning, warning, warning
 *
 * Output HTML:
 *   <div class="callout callout-info">
 *     <p class="callout-title">Optional title</p>
 *     <p>Content here</p>
 *   </div>
 */

const ALERT_PATTERN = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)?$/i;

const TYPE_MAP: Record<string, string> = {
  note: "info",
  tip: "tip",
  warning: "warning",
  important: "warning",
  caution: "warning",
};

const DEFAULT_TITLES: Record<string, string> = {
  note: "참고",
  tip: "팁",
  warning: "주의",
  important: "중요",
  caution: "주의",
};

export function remarkCallout() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote, index, parent) => {
      if (index === undefined || !parent) return;
      if (node.children.length === 0) return;

      // First child should be a paragraph with the alert marker
      const firstChild = node.children[0];
      if (firstChild.type !== "paragraph") return;

      const firstInline = firstChild.children[0];
      if (!firstInline || firstInline.type !== "text") return;

      const match = (firstInline as Text).value.match(ALERT_PATTERN);
      if (!match) return;

      const alertType = match[1].toLowerCase();
      const calloutType = TYPE_MAP[alertType] ?? "info";
      const title = match[2]?.trim() || DEFAULT_TITLES[alertType] || alertType;

      // Remove the alert marker from the first paragraph
      const remainingText = (firstInline as Text).value
        .replace(ALERT_PATTERN, "")
        .trim();

      // Build inner content HTML
      const innerParagraphs: string[] = [];

      if (remainingText) {
        innerParagraphs.push(`<p>${escapeHtml(remainingText)}</p>`);
      }

      // Process remaining children of first paragraph (after the marker text)
      if (firstChild.children.length > 1) {
        const restText = firstChild.children
          .slice(1)
          .map((c) => ("value" in c ? (c as Text).value : ""))
          .join("");
        if (restText.trim()) {
          if (innerParagraphs.length > 0) {
            innerParagraphs[0] = `<p>${escapeHtml(remainingText + restText.trim())}</p>`;
          } else {
            innerParagraphs.push(`<p>${escapeHtml(restText.trim())}</p>`);
          }
        }
      }

      // Process remaining blockquote children (paragraphs after the first)
      for (let i = 1; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === "paragraph") {
          const text = child.children
            .map((c) => ("value" in c ? (c as Text).value : ""))
            .join("");
          if (text.trim()) {
            innerParagraphs.push(`<p>${escapeHtml(text.trim())}</p>`);
          }
        }
      }

      const html = [
        `<div class="callout callout-${calloutType}">`,
        `<p class="callout-title">${escapeHtml(title)}</p>`,
        ...innerParagraphs,
        `</div>`,
      ].join("\n");

      const htmlNode = { type: "html", value: html };
      parent.children.splice(index, 1, htmlNode as never);
    });
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
