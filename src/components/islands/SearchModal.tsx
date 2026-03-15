import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchModalProps {
  locale: string;
}

export default function SearchModal({ locale }: SearchModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground gap-2"
        aria-label="Open search"
      >
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline">
          {locale === "ko" ? "검색" : "Search"}
        </span>
        <kbd className="border-border bg-muted text-muted-foreground pointer-events-none hidden rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{locale === "ko" ? "검색" : "Search"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="search"
              placeholder={
                locale === "ko"
                  ? "글 제목이나 내용을 검색하세요..."
                  : "Search posts..."
              }
              autoFocus
            />
            <p className="text-muted-foreground text-center text-sm">
              {locale === "ko"
                ? "검색 기능이 곧 추가됩니다."
                : "Search coming soon."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
