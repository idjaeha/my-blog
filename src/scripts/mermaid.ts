/**
 * Mermaid initialization script for Supabase blog posts
 * Adds modal viewer and zoom functionality to mermaid diagrams
 */

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

interface ModalState {
  isOpen: boolean;
  scale: number;
  svgContent: string;
}

const modalState: ModalState = {
  isOpen: false,
  scale: 1,
  svgContent: "",
};

function createModal() {
  const modal = document.createElement("div");
  modal.id = "mermaid-modal";
  modal.className =
    "fixed inset-0 z-50 hidden flex-col bg-black/60 backdrop-blur-sm";
  modal.innerHTML = `
    <!-- Toolbar -->
    <div class="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900">
      <div class="flex items-center gap-1">
        <button
          type="button"
          id="mermaid-zoom-out"
          class="rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
        </button>
        <button
          type="button"
          id="mermaid-zoom-reset"
          class="min-w-[3.5rem] rounded-md px-2 py-1 text-center text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          title="원래 크기로"
        >
          100%
        </button>
        <button
          type="button"
          id="mermaid-zoom-in"
          class="rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
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
        id="mermaid-close"
        class="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
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
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Diagram area -->
    <div class="flex-1 overflow-auto bg-white dark:bg-neutral-900">
      <div class="flex min-h-full items-center justify-center p-8">
        <div
          id="mermaid-modal-content"
          class="w-[90vw] max-w-[1200px] transition-transform duration-150"
        ></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Event listeners
  const closeBtn = modal.querySelector("#mermaid-close")!;
  const zoomInBtn = modal.querySelector("#mermaid-zoom-in")!;
  const zoomOutBtn = modal.querySelector("#mermaid-zoom-out")!;
  const zoomResetBtn = modal.querySelector("#mermaid-zoom-reset")!;

  closeBtn.addEventListener("click", closeModal);
  zoomInBtn.addEventListener("click", zoomIn);
  zoomOutBtn.addEventListener("click", zoomOut);
  zoomResetBtn.addEventListener("click", zoomReset);

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalState.isOpen) {
      closeModal();
    }
  });

  // Prevent clicks inside modal from closing it
  const toolbar = modal.querySelector("div:first-child")!;
  const diagramArea = modal.querySelector(".flex-1")!;
  toolbar.addEventListener("click", (e) => e.stopPropagation());
  diagramArea.addEventListener("click", (e) => e.stopPropagation());
}

function openModal(svgContent: string) {
  const modal = document.getElementById("mermaid-modal");
  if (!modal) return;

  modalState.isOpen = true;
  modalState.scale = 1;
  modalState.svgContent = svgContent;

  const contentDiv = modal.querySelector("#mermaid-modal-content")!;
  contentDiv.innerHTML = svgContent;

  // Remove fixed width/height so SVG fills the modal container
  const svg = contentDiv.querySelector("svg");
  if (svg) {
    svg.removeAttribute("width");
    svg.setAttribute("width", "100%");
    svg.removeAttribute("height");
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";

  updateZoomButtons();
}

function closeModal() {
  const modal = document.getElementById("mermaid-modal");
  if (!modal) return;

  modalState.isOpen = false;
  modalState.scale = 1;

  modal.classList.remove("flex");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function zoomIn() {
  if (modalState.scale >= SCALE_MAX) return;
  modalState.scale = Math.min(modalState.scale + SCALE_STEP, SCALE_MAX);
  updateZoom();
}

function zoomOut() {
  if (modalState.scale <= SCALE_MIN) return;
  modalState.scale = Math.max(modalState.scale - SCALE_STEP, SCALE_MIN);
  updateZoom();
}

function zoomReset() {
  modalState.scale = 1;
  updateZoom();
}

function updateZoom() {
  const contentDiv = document.getElementById("mermaid-modal-content");
  if (!contentDiv) return;

  contentDiv.style.transform = `scale(${modalState.scale})`;
  contentDiv.style.transformOrigin = "center center";

  const parent = contentDiv.parentElement;
  if (parent && modalState.scale > 1) {
    parent.style.minWidth = `${modalState.scale * 100}%`;
    parent.style.minHeight = `${modalState.scale * 100}%`;
  } else if (parent) {
    parent.style.minWidth = "";
    parent.style.minHeight = "";
  }

  updateZoomButtons();
}

function updateZoomButtons() {
  const zoomInBtn = document.getElementById(
    "mermaid-zoom-in",
  ) as HTMLButtonElement;
  const zoomOutBtn = document.getElementById(
    "mermaid-zoom-out",
  ) as HTMLButtonElement;
  const zoomResetBtn = document.getElementById("mermaid-zoom-reset");

  if (zoomInBtn) zoomInBtn.disabled = modalState.scale >= SCALE_MAX;
  if (zoomOutBtn) zoomOutBtn.disabled = modalState.scale <= SCALE_MIN;
  if (zoomResetBtn)
    zoomResetBtn.textContent = `${Math.round(modalState.scale * 100)}%`;
}

function wrapDiagramWithButton(diagramDiv: HTMLElement) {
  // Create wrapper div with relative positioning for button
  const wrapper = document.createElement("div");
  wrapper.className = "group relative my-6";

  // Create expand button
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "absolute top-2 right-2 z-10 rounded-md border border-neutral-200 bg-white/80 p-1.5 text-neutral-500 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-white hover:text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200";
  button.setAttribute("aria-label", "다이어그램 확대");
  button.title = "확대해서 보기";
  button.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  `;

  // Replace the diagram div with wrapper
  diagramDiv.parentNode!.insertBefore(wrapper, diagramDiv);
  wrapper.appendChild(diagramDiv);
  wrapper.appendChild(button);

  // Make diagram clickable
  diagramDiv.style.cursor = "pointer";

  // Get SVG content for modal
  const svg = diagramDiv.querySelector("svg");
  const svgContent = svg ? svg.outerHTML : "";

  // Click handlers
  const openModalHandler = () => openModal(svgContent);
  diagramDiv.addEventListener("click", openModalHandler);
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    openModalHandler();
  });
}

// Initialize mermaid diagrams
(function initMermaid() {
  const els = document.querySelectorAll<HTMLElement>("pre.mermaid");
  if (els.length === 0) return;

  // @ts-expect-error - CDN module import
  import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs").then(
    (m: any) => {
      const isDark = document.documentElement.classList.contains("dark");
      m.default.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        fontFamily: "inherit",
        themeVariables: isDark ? DARK_THEME_VARIABLES : LIGHT_THEME_VARIABLES,
      });
      m.default.run({ nodes: els }).then(() => {
        // After mermaid renders, wrap each diagram
        const diagrams =
          document.querySelectorAll<HTMLElement>(".mermaid-diagram");
        diagrams.forEach((diagram) => {
          if (!diagram.querySelector("svg")) return;
          wrapDiagramWithButton(diagram);
        });

        // Create modal (only once)
        if (!document.getElementById("mermaid-modal")) {
          createModal();
        }
      });
    },
  );
})();
