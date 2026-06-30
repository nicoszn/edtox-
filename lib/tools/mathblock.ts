import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";

export interface MathData {
  latex: string;
}

/**
 * A LaTeX block, separate from editorjs-mathcyou's own MathBlockTool. That
 * package's saved-data field name isn't documented anywhere reachable, and
 * guessing it risks silently losing content on save/reload. This tool owns
 * its data contract outright ({ latex: string }) so paste-detection and
 * export code never have to guess a third-party shape.
 */
export default class MathBlock implements BlockTool {
  private data: MathData;
  private wrapper: HTMLElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private preview: HTMLElement | null = null;

  static get toolbox() {
    return {
      title: "Math",
      icon:
        '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><text x="0" y="12" font-size="13" font-family="serif" fill="currentColor">∑</text></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data }: BlockToolConstructorOptions<Partial<MathData>>) {
    this.data = { latex: data?.latex ?? "" };
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("math-block-wrapper");

    const textarea = document.createElement("textarea");
    textarea.classList.add("math-block-input");
    textarea.value = this.data.latex;
    textarea.placeholder = "E = mc^2";
    textarea.spellcheck = false;
    textarea.addEventListener("input", () => {
      this.data.latex = textarea.value;
      this.renderPreview();
    });
    this.textarea = textarea;

    const preview = document.createElement("div");
    preview.classList.add("math-block-preview");
    this.preview = preview;

    wrapper.append(textarea, preview);
    this.wrapper = wrapper;
    this.renderPreview();

    return wrapper;
  }

  private async renderPreview(): Promise<void> {
    if (!this.preview) return;
    const latex = this.data.latex.trim();
    if (!latex) {
      this.preview.innerHTML = "";
      return;
    }
    try {
      const katex = (await import("katex")).default;
      this.preview.innerHTML = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      this.preview.textContent = latex;
    }
  }

  save(): MathData {
    return this.data;
  }

  static get sanitize() {
    return { latex: false };
  }
}
