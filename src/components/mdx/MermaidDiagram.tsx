import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

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

        // Use DOMParser to safely parse the SVG string
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, "image/svg+xml");
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

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        <p className="font-semibold">Mermaid diagram error</p>
        <pre className="mt-2 overflow-x-auto text-xs">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram my-6 flex justify-center overflow-x-auto [&>svg]:max-w-full"
      role="img"
      aria-label="Mermaid diagram"
    />
  );
}
