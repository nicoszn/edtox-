import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";
import mermaid from "mermaid";

export interface MermaidData {
  source: string;
}

const DEFAULT_SOURCE =
  "graph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|Yes| D[Success]\n  C -->|No| E[Error]";

// ✅ Client‑only initialization (safe for Next.js SSR)
if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      background: "#fafaf8",
      primaryColor: "#e8e4dc",
      lineColor: "#8b5a3c",
    },
  });
}

export default class Mermaid implements BlockTool {
  private data: MermaidData;
  private mode: "edit" | "preview";
  // Stable base ID for this block instance – we'll append a timestamp per render.
  private readonly baseId: string;

  static get toolbox() {
    return {
      title: "Diagram",
      icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="5" height="4" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="10" y="1" width="5" height="4" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="5.5" y="9" width="6" height="4" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 5v2a2 2 0 002 2h0M12.5 5v2a2 2 0 01-2 2h0M8.5 9V7" stroke="currentColor" stroke-width="1.1" fill="none"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data }: BlockToolConstructorOptions<Partial<MermaidData>>) {
    this.data = { source: data?.source ?? DEFAULT_SOURCE };
    // Default to preview if source exists, otherwise edit for a blank start.
    this.mode = data?.source ? "preview" : "edit";
    this.baseId = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("mermaid-block");

    // ---- Toolbar ----
    const toolbar = document.createElement("div");
    toolbar.classList.add("mermaid-toolbar");

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.classList.add("mermaid-toggle");
    toolbar.appendChild(toggleBtn);
    wrapper.appendChild(toolbar);

    // ---- Source Editor ----
    const textarea = document.createElement("textarea");
    textarea.classList.add("mermaid-source");
    textarea.value = this.data.source;
    textarea.spellcheck = false;
    textarea.placeholder = "graph TD\n  A[Start] --> B[End]";
    wrapper.appendChild(textarea);

    // ---- Preview Container ----
    const preview = document.createElement("div");
    preview.classList.add("mermaid-preview");
    wrapper.appendChild(preview);

    // ---- Core Render Function (fixed) ----
    const renderDiagram = async (src: string) => {
      if (!src.trim()) {
        preview.innerHTML =
          '<p class="mermaid-empty">No diagram source yet.</p>';
        return;
      }
      try {
        // ✅ FIX 1: Unique ID per render call – avoids "already registered"
        const renderId = `${this.baseId}-${Date.now()}`;
        // ✅ FIX 2: Remove the cached "processed" flag – forces re-render
        preview.removeAttribute("data-processed");
        const { svg } = await mermaid.render(renderId, src);
        preview.innerHTML = svg;
      } catch (err) {
        console.warn("Mermaid render error:", err);
        preview.innerHTML =
          '<p class="mermaid-error">Invalid diagram syntax.</p>';
      }
    };

    // ---- Live update while typing (only in preview mode) ----
    textarea.addEventListener("input", () => {
      this.data.source = textarea.value;
      // If we are in preview mode, re‑render on every keystroke.
      if (this.mode === "preview") {
        renderDiagram(textarea.value);
      }
    });

    // ---- Mode toggle logic ----
    const applyMode = () => {
      const isEdit = this.mode === "edit";
      textarea.style.display = isEdit ? "block" : "none";
      preview.style.display = isEdit ? "none" : "block";
      toggleBtn.textContent = isEdit ? "Preview" : "Edit source";
    };

    toggleBtn.addEventListener("click", () => {
      this.mode = this.mode === "edit" ? "preview" : "edit";
      applyMode();
      // When switching to preview, render the current source.
      if (this.mode === "preview") {
        renderDiagram(this.data.source);
      }
    });

    // ---- Initial setup ----
    applyMode();
    // If we start in preview mode (existing diagram), render after mount.
    if (this.mode === "preview") {
      // Small delay ensures the DOM is ready.
      setTimeout(() => renderDiagram(this.data.source), 50);
    }

    return wrapper;
  }

  save(): MermaidData {
    return this.data;
  }

  // Disable sanitization – we want the raw source string.
  static get sanitize() {
    return { source: false };
  }
}
