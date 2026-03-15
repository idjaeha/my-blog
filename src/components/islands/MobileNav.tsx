import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  locale: string;
  links: { href: string; label: string }[];
}

export default function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) {
      setVisible(true);
    }
  }, [open]);

  const handleTransitionEnd = useCallback(() => {
    if (!open) {
      setVisible(false);
    }
  }, [open]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </Button>

      {visible &&
        createPortal(
          <>
            {/* Overlay */}
            <div
              className={cn(
                "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
                open ? "opacity-100" : "opacity-0",
              )}
              onClick={close}
              aria-hidden="true"
            />

            {/* Slide-out panel */}
            <nav
              ref={navRef}
              className={cn(
                "bg-background border-border fixed inset-y-0 right-0 z-50 w-64 border-l shadow-lg transition-transform duration-200 ease-out",
                open ? "translate-x-0" : "translate-x-full",
              )}
              aria-label="Mobile navigation"
              onTransitionEnd={handleTransitionEnd}
            >
              <div className="flex items-center justify-end p-4">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={close}
                  aria-label="Close navigation menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </Button>
              </div>

              <ul className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={close}
                      className="text-foreground hover:bg-muted block rounded-md px-3 py-2 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </>,
          document.body,
        )}
    </>
  );
}
