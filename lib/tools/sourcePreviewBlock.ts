import type { BlockTool } from "@editorjs/editorjs";

export interface SourcePreviewOptions<TData extends Record<string, unknown>> {
  initialData: Partial<TData>;
  defaults: TData;
  sourceField: keyof TData & string;
  placeholder: string;
  emptyMessage: string;
  /** Explicit start mode. If omitted, derived from whether initialData had a value. */
  initialMode?: "edit" | "preview";
  renderPreview: (source: string) => Promise<string> | string;
}

/**
 * Shared scaffold for block tools that store a plain-text "source" (LaTeX,
 * Mermaid syntax, …) and show a toggleable rendered preview next to it.
 *
 * MathBlock and MermaidBlock used to be two independent, near-identical
 * ~100-line classes (toolbar, toggle button, textarea, preview pane, mode
 * switching) that had drifted slightly out of sync with each other. This
 * class is now the single place that wiring lives; each tool supplies only
 * what's actually different: its data shape, its placeholder text, and its
 * render function.
 */
export abstract class SourcePreviewBlock<TData extends Record<string, unknown>>
  implements BlockTool
{
  protected data: TData;
  private mode: "edit" | "preview";
  private readonly sourceField: keyof TData & string;
  private readonly placeholder: string;
  private readonly emptyMessage: string;
  private readonly renderFn: (source: string) => Promise<string> | string;

  /** Outer wrapper class, e.g. "math-block" or "mermaid-block". Subclass supplies this so each tool can still be styled independently. */
  protected abstract get blockClass(): string;

  constructor(opts: SourcePreviewOptions<TData>) {
    this.data = { ...opts.defaults, ...opts.initialData };
    this.sourceField = opts.sourceField;
    this.placeholder = opts.placeholder;
    this.emptyMessage = opts.emptyMessage;
    this.renderFn = opts.renderPreview;
    this.mode = opts.initialMode ?? (this.currentSource() ? "preview" : "edit");
  }

  static get isReadOnlySupported() {
    return true;
  }

  private currentSource(): string {
    return String(this.data[this.sourceField] ?? "");
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add(this.blockClass, "source-preview-block");

    const toolbar = document.createElement("div");
    toolbar.classList.add("source-preview-toolbar");
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.classList.add("source-preview-toggle");
    toolbar.appendChild(toggleBtn);
    wrapper.appendChild(toolbar);

    const textarea = document.createElement("textarea");
    textarea.classList.add("source-preview-source");
    textarea.value = this.currentSource();
    textarea.placeholder = this.placeholder;
    textarea.spellcheck = false;
    wrapper.appendChild(textarea);

    const preview = document.createElement("div");
    preview.classList.add("source-preview-output");
    wrapper.appendChild(preview);

    const paint = async (source: string) => {
      if (!source.trim()) {
        preview.innerHTML = `<p class="source-preview-empty">${this.emptyMessage}</p>`;
        return;
      }
      try {
        preview.innerHTML = await this.renderFn(source);
      } catch {
        preview.innerHTML = `<span class="source-preview-error">Couldn't render this.</span>`;
      }
    };

    textarea.addEventListener("input", () => {
      (this.data as Record<string, unknown>)[this.sourceField] = textarea.value;
      if (this.mode === "preview") paint(textarea.value);
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
      if (this.mode === "preview") paint(this.currentSource());
    });

    applyMode();
    if (this.mode === "preview") paint(this.currentSource());

    return wrapper;
  }

  save(): TData {
    return this.data;
  }
}
