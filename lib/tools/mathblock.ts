import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";
import 'katex/dist/katex.min.css';
export interface MathData {
  latex: string;
}

export default class MathBlock implements BlockTool {
  private data: MathData;
  private mode: "edit" | "preview";

  static get toolbox() {
    return {
      title: "Math",
      icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><text x="0" y="12" font-size="13" font-family="serif" fill="currentColor">∑</text></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data }: BlockToolConstructorOptions<Partial<MathData>>) {
    this.data = { latex: data?.latex ?? "" };
    this.mode = data?.latex ? "preview" : "edit";
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("mermaid-block"); // reuse identical structural styling

    const toolbar = document.createElement("div");
    toolbar.classList.add("mermaid-toolbar");

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.classList.add("mermaid-toggle");
    toolbar.appendChild(toggleBtn);
    wrapper.appendChild(toolbar);

    const textarea = document.createElement("textarea");
    textarea.classList.add("mermaid-source");
    textarea.value = this.data.latex;
    textarea.spellcheck = false;
    textarea.placeholder = "E = mc^2";
    wrapper.appendChild(textarea);

    const preview = document.createElement("div");
    // math-block-preview handles overflow + display-mode centering in CSS
    preview.classList.add("math-block-preview");
    wrapper.appendChild(preview);

    const renderPreview = async (latex: string) => {
      if (!latex.trim()) {
        preview.innerHTML = "";
        return;
      }
      try {
        const katex = (await import("katex")).default;
        preview.innerHTML = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: true,
          // Let KaTeX break long expressions rather than overflow
          output: "html",
        });
      } catch {
        preview.textContent = latex;
      }
    };

    textarea.addEventListener("input", () => {
      this.data.latex = textarea.value;
      if (this.mode === "preview") renderPreview(textarea.value);
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
      if (this.mode === "preview") renderPreview(this.data.latex);
    });

    applyMode();
    if (this.mode === "preview") renderPreview(this.data.latex);

    return wrapper;
  }

  save(): MathData {
    return this.data;
  }

  static get sanitize() {
    return { latex: false };
  }
}
