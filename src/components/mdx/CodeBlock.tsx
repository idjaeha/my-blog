import { type ReactNode, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  filename?: string;
  children: ReactNode;
}

export default function CodeBlock({ filename, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    const text = codeRef.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, []);

  return (
    <div className="group border-border relative my-6 overflow-hidden rounded-lg border">
      {filename && (
        <div className="border-border bg-muted text-muted-foreground flex items-center border-b px-4 py-2 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 shrink-0"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>{filename}</span>
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "border-border bg-background/80 absolute top-2 right-2 z-10 rounded-md border px-2 py-1 text-xs backdrop-blur-sm transition-opacity",
            "hover:bg-muted focus-visible:ring-ring opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none",
          )}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <span className="flex items-center gap-1 text-green-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </span>
          )}
        </button>
        <div
          ref={codeRef}
          className="overflow-x-auto [&>pre]:m-0 [&>pre]:rounded-none [&>pre]:border-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
