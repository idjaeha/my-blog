import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        });

        const id = `mermaid-modal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (cancelled || !modalContainerRef.current) return;

        const sanitizedSvg = svg.replace(/<br\s*(?!\/)>/gi, "<br/>");
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitizedSvg, "image/svg+xml");
        const svgElement = doc.documentElement;

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

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative m-4 max-h-[90vh] max-w-[95vw] overflow-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-3 right-3 rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="닫기"
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
            <div
              ref={modalContainerRef}
              className="mermaid-diagram flex min-h-50 items-center justify-center [&>svg]:max-h-[80vh] [&>svg]:max-w-[85vw]"
              role="img"
              aria-label="Mermaid diagram (expanded)"
            />
          </div>
        </div>
      )}
    </>
  );
}
