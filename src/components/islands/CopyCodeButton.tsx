import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CopyCodeButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const codeBlock = document.querySelector(
      "pre:hover code, pre:focus-within code",
    );
    if (!codeBlock) return;

    try {
      await navigator.clipboard.writeText(codeBlock.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleCopy}
      className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </Button>
  );
}
