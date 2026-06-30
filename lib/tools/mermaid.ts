import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";

export interface MermaidData {
  source: string;
}

const DEFAULT_SOURCE = "graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Result]\n  B -->|No| D[Other]";

let mermaidInitialized = false;
let renderCounter = 0;

async function getMermaid() {
  const mermaid = (await import("mermaid")).default;
  if (!mermaidInitialized) {
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
    mermaidInitialized = true;
  }
  return mermaid;
}

/**
 * A Mermaid diagram block: a textarea for the diagram source (flowcharts,
 * sequence diagrams, etc.) and a live SVG preview rendered via the mermaid
 * package, entirely client-side — no network call, no external service.
 */
export default class Mermaid implements BlockTool {
  private data: MermaidData;
  private wrapper: HTMLElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private preview: HTMLElement | null = null;
  private mode: "edit" | "preview" = "preview";

  static get toolbox() {
    return {
      title: "Diagram",
      icon:
        '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="5" height="4" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="10" y="1" width="5" height="4" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="5.5" y="9" width="6" height="4" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 5v2a2 2 0 002 2h0M12.5 5v2a2 2 0 01-2 2h0M8.5 9V7" stroke="currentColor" stroke-width="1.1" fill="none"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data }: BlockToolConstructorOptions<Partial<MermaidData>>) {
    this.data = { source: data?.source ?? DEFAULT_SOURCE };
    // Start in edit mode only for a brand-new empty block; existing
    // documents open straight to the rendered diagram.
    this.mode = data?.source ? "preview" : "edit";
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("mermaid-block");

    const toolbar = document.createElement("div");
    toolbar.classList.add("mermaid-toolbar");

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.classList.add("mermaid-toggle");
    toggleBtn.textContent = this.mode === "edit" ? "Preview" : "Edit source";
    toggleBtn.addEventListener("click", () => this.toggleMode());

    toolbar.appendChild(toggleBtn);

    const textarea = document.createElement("textarea");
    textarea.classList.add("mermaid-source");
    textarea.value = this.data.source;
    textarea.spellcheck = false;
    textarea.placeholder = "graph TD\n  A[Start] --> B[End]";
    textarea.addEventListener("input", () => {
      this.data.source = textarea.value;
    });
    this.textarea = textarea;

    const preview = document.createElement("div");
    preview.classList.add("mermaid-preview");
    this.preview = preview;

    wrapper.append(toolbar, textarea, preview);
    this.wrapper = wrapper;
    this.applyMode();

    if (this.mode === "preview") {
      this.renderDiagram();
    }

    return wrapper;
  }

  private toggleMode(): void {
    this.mode = this.mode === "edit" ? "preview" : "edit";
    this.applyMode();
    if (this.mode === "preview") this.renderDiagram();
  }

  private applyMode(): void {
    if (!this.wrapper || !this.textarea || !this.preview) return;
    const toggleBtn = this.wrapper.querySelector(".mermaid-toggle") as HTMLButtonElement | null;
    if (this.mode === "edit") {
      this.textarea.style.display = "block";
      this.preview.style.display = "none";
      if (toggleBtn) toggleBtn.textContent = "Preview";
    } else {
      this.textarea.style.display = "none";
      this.preview.style.display = "block";
      if (toggleBtn) toggleBtn.textContent = "Edit source";
    }
  }

  private async renderDiagram(): Promise<void> {
    if (!this.preview) return;
    const source = this.data.source.trim();
    if (!source) {
      this.preview.innerHTML = '<p class="mermaid-empty">No diagram source yet.</p>';
      return;
    }
    try {
      const mermaid = await getMermaid();
      const id = `mermaid-${Date.now()}-${renderCounter++}`;
      const { svg } = await mermaid.render(id, source);
      this.preview.innerHTML = svg;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not render diagram.";
      this.preview.innerHTML = `<p class="mermaid-error">${message}</p>`;
    }
  }

  save(): MermaidData {
    return this.data;
  }

  static get sanitize() {
    return { source: false };
  }
}
