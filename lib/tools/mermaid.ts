import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";
import mermaid from "mermaid";

export interface MermaidData {
  source: string;
}

const DEFAULT_SOURCE =
  "graph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|Yes| D[Success]\n  C -->|No| E[Error]";

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
  // Stable per-instance base ID — avoids the "already registered" error
  // that occurs when mermaid.render() is called twice with the same SVG ID.
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
    this.mode = data?.source ? "preview" : "edit";
    this.baseId = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("mermaid-block");

    const toolbar = document.createElement("div");
    toolbar.classList.add("mermaid-toolbar");

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.classList.add("mermaid-toggle");
    toolbar.appendChild(toggleBtn);
    wrapper.appendChild(toolbar);

    const textarea = document.createElement("textarea");
    textarea.classList.add("mermaid-source");
    textarea.value = this.data.source;
    textarea.spellcheck = false;
    textarea.placeholder = "graph TD\n  A[Start] --> B[End]";
    wrapper.appendChild(textarea);

    const preview = document.createElement("div");
    preview.classList.add("mermaid-preview");
    wrapper.appendChild(preview);

    const renderDiagram = async (src: string) => {
      if (!src.trim()) {
        preview.innerHTML = '<p class="mermaid-empty">No diagram source yet.</p>';
        return;
      }
      try {
        // Fresh ID per render call prevents mermaid's internal diagram
        // registry from throwing "already registered" on re-renders.
        const renderId = `${this.baseId}-${Date.now()}`;
        preview.removeAttribute("data-processed");
        const { svg } = await mermaid.render(renderId, src);
        preview.innerHTML = svg;
      } catch {
        preview.innerHTML = '<p class="mermaid-error">Invalid diagram syntax.</p>';
      }
    };

    textarea.addEventListener("input", () => {
      this.data.source = textarea.value;
      if (this.mode === "preview") renderDiagram(textarea.value);
    });

    const applyMode = () => {
      const isEdit = this.mode === "edit";
      textarea.style.display = isEdit ? "block" : "none";
      preview.style.display = isEdit ? "none" : "block";
      toggleBtn.textContent = isEdit ? "Preview" : "Edit source";
    };

    toggleBtn.addEventListener("click", () => {
      this.mode = this.mode === "edit" ? "preview" : "edit";
      applyMode();
      if (this.mode === "preview") renderDiagram(this.data.source);
    });

    applyMode();
    if (this.mode === "preview") {
      setTimeout(() => renderDiagram(this.data.source), 50);
    }

    return wrapper;
  }

  save(): MermaidData {
    return this.data;
  }

  static get sanitize() {
    return { source: false };
  }
}
