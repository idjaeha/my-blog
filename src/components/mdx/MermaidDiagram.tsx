import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
}

const SCALE_STEP = 0.25;
const SCALE_MIN = 0.5;
const SCALE_MAX = 3;

const LIGHT_THEME_VARIABLES = {
  primaryColor: "#e0e7ff",
  primaryTextColor: "#1e293b",
  primaryBorderColor: "#6366f1",
  lineColor: "#475569",
  textColor: "#1e293b",
  secondaryColor: "#f0fdf4",
  tertiaryColor: "#fefce8",
};

const DARK_THEME_VARIABLES = {
  primaryColor: "#312e81",
  primaryTextColor: "#f1f5f9",
  primaryBorderColor: "#818cf8",
  lineColor: "#94a3b8",
  textColor: "#f1f5f9",
  secondaryColor: "#1e3a2f",
  tertiaryColor: "#3b2f1e",
};

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      if (!containerRef.current) return;

      try {
        const mermaid = (await import("mermaid")).default;

        const isDark = document.documentElement.classList.contains("dark");

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "default",
          fontFamily: "inherit",
          themeVariables: isDark ? DARK_THEME_VARIABLES : LIGHT_THEME_VARIABLES,
        });

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (cancelled || !containerRef.current) return;

        // Mermaid converts \n to <br> which is invalid in XML/SVG
        const sanitizedSvg = svg.replace(/<br\s*(?!\/)>/gi, "<br/>");

        // Use DOMParser to safely parse the SVG string
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitizedSvg, "image/svg+xml");
        const svgElement = doc.documentElement;

        // Clear previous content safely using DOM methods
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }

        // Import and append the parsed SVG node
        containerRef.current.appendChild(document.importNode(svgElement, true));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
        }
      }
    }

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  // Re-render diagram inside modal when opened
  useEffect(() => {
    if (!isModalOpen || !modalContainerRef.current) return;

    let cancelled = false;

    async function renderModalChart() {
      if (!modalContainerRef.current) return;

      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = document.documentElement.classList.contains("dark");

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "default",
          fontFamily: "inherit",
          themeVariables: isDark ? DARK_THEME_VARIABLES : LIGHT_THEME_VARIABLES,
        });

        const id = `mermaid-modal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (cancelled || !modalContainerRef.current) return;

        const sanitizedSvg = svg.replace(/<br\s*(?!\/)>/gi, "<br/>");
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitizedSvg, "image/svg+xml");
        const svgElement = doc.documentElement;

        // Remove fixed width/height so SVG fills the modal container
        svgElement.removeAttribute("width");
        svgElement.setAttribute("width", "100%");
        svgElement.removeAttribute("height");

        while (modalContainerRef.current.firstChild) {
          modalContainerRef.current.removeChild(
            modalContainerRef.current.firstChild,
          );
        }

        modalContainerRef.current.appendChild(
          document.importNode(svgElement, true),
        );
      } catch {
        // Modal rendering error is non-critical, inline diagram still visible
      }
    }

    renderModalChart();

    return () => {
      cancelled = true;
    };
  }, [isModalOpen, chart]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isModalOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsModalOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const openModal = useCallback(() => {
    setScale(1);
    setIsModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const zoomIn = useCallback(
    () => setScale((s) => Math.min(s + SCALE_STEP, SCALE_MAX)),
    [],
  );
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(s - SCALE_STEP, SCALE_MIN)),
    [],
  );
  const zoomReset = useCallback(() => setScale(1), []);

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        <p className="font-semibold">Mermaid diagram error</p>
        <pre className="mt-2 overflow-x-auto text-xs">{error}</pre>
      </div>
    );
  }

  return (
    <>
      <div className="group relative my-6">
        <button
          type="button"
          onClick={openModal}
          className="absolute top-2 right-2 z-10 rounded-md border border-neutral-200 bg-white/80 p-1.5 text-neutral-500 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-white hover:text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label="다이어그램 확대"
          title="확대해서 보기"
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
          >
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>
        <div
          ref={containerRef}
          className="mermaid-diagram flex cursor-pointer justify-center overflow-x-auto [&>svg]:max-w-full"
          role="img"
          aria-label="Mermaid diagram"
          onClick={openModal}
        />
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          {/* Toolbar */}
          <div
            className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= SCALE_MIN}
                className="rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800"
                aria-label="축소"
                title="축소"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M8 11h6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={zoomReset}
                className="min-w-[3.5rem] rounded-md px-2 py-1 text-center text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                title="원래 크기로"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= SCALE_MAX}
                className="rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800"
                aria-label="확대"
                title="확대"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M11 8v6" />
                  <path d="M8 11h6" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="닫기"
              title="닫기 (Esc)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Diagram area */}
          <div
            className="flex-1 overflow-auto bg-white dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex min-h-full items-center justify-center p-8"
              style={{
                minWidth: scale > 1 ? `${scale * 100}%` : undefined,
                minHeight: scale > 1 ? `${scale * 100}%` : undefined,
              }}
            >
              <div
                ref={modalContainerRef}
                className="mermaid-diagram w-[90vw] max-w-[1200px] transition-transform duration-150 [&>svg]:w-full"
                role="img"
                aria-label="Mermaid diagram (expanded)"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
